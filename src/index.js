const child_process = require('child_process')
const inquirer = require('inquirer')
const util = require('util')

const debug = require('./debug')

const exec = util.promisify(child_process.exec)

const cmd = c => child_process.execSync(c).toString().trim()

const getRunningContainersOrThrowError = () => {
  const containerIdsRaw = cmd(`docker ps --format '{{.ID}}'`)
  if (containerIdsRaw === '') {
    throw new Error('No running containers')
  }
  return containerIdsRaw.split('\n')
}

const getAdditionalInfoForContainers = (containerIds) => {
  const commandToGetRunningContainerInfo = `docker inspect --format '{{.HostConfig.NetworkMode}} |{{range $p, $conf := .NetworkSettings.Ports}}{{$p}},{{(index $conf 0).HostPort}};{{end}}| {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}} {{.State.Pid}} {{printf "%.13s" .ID}} {{.Name}}' ${containerIds.join(' ')}`
  return cmd(commandToGetRunningContainerInfo).split('\n') // renamed from results
}

const getNetworkInfoForContainersByAdditionalContainerInfo = async (containersInfo) => {
  // async get network info for each container
  const promises = containersInfo.map(containerInfo => {
    const [networkName, portInfo, ip, pid, _id, name] = containerInfo.split(' ')
    const promise = exec(`docker run --rm -i --privileged --pid=host alpine:latest nsenter -t ${pid} -n -- netstat -pan`).then(b => b.stdout.toString().trim())
    return promise.then(p => ({
      networkName,
      portInfo: portInfo
        .slice(1, -1) // clip the surrounding ||
        .split(';') // split any `;`
        .filter(x => x) // blah;blah; splits to => ['blah', 'blah', ''], so trim the empty string entry
        .map(x => x.split(',')), // this could be || or formatted like |8000/tcp,8000;8080/tcp,8080;| becomes [] or [[8000/tcp, 8000], [8080/tcp, 8080]]
      ip,
      name,
      p
    }))
  })

  return Promise.all(promises)
}

const questionAnswerObjectReducer = (acc, { networkName, portInfo, ip, name, p }) => {
  const ports = p.split('\n').map(l => {
    const regex = new RegExp(/(?:tcp6?|udp) +\w +\w (?:0.0.0.0|::|localhost|127.0.0.1):(\d+)/)
    return regex.exec(l)
  }).filter(x => x).map(x => x[1]) // get the captured group

  ports
    .filter(port => !(portInfo.some(mapping => mapping[0].split('/')[0] === port)))
    .forEach(port => {
      acc[`${networkName} ${ip} ${port}`] = {
        question: {
          name: `${name} ${port} (on network: ${networkName})`,
          value: `${networkName} ${ip} ${port}`
        },
        answer: {
          default: port,
          cmd: (portToExpose) => `docker run -d --rm -p ${portToExpose}:${port} --network=${networkName} alpine/socat tcp-listen:${port},fork,reuseaddr tcp-connect:${ip}:${port}`,
          name
        }
      }
    })
  return acc
}

async function main () {
  debug('Starting...')
  // Get all running containerIDs

  const containerIds = getRunningContainersOrThrowError()
  debug(`Container IDs: ${containerIds}`)

  const containersInfo = getAdditionalInfoForContainers(containerIds)
  debug(`Running Containers' Info:\n ${containersInfo}`)

  const containersNetworkInfo = await getNetworkInfoForContainersByAdditionalContainerInfo(containersInfo)
  debug(`Running Containers' Network Info:\n ${containersNetworkInfo.map(x => JSON.stringify(x)).join('\n')}`)

  // get ports from p
  const qa = containersNetworkInfo.reduce(questionAnswerObjectReducer, {})

  inquirer.prompt([
    {
      name: 'portOpen',
      type: 'list',
      message: 'Open a port?',
      choices: [ ...Object.values(qa).map(v => v.question), 'Nevermind.' ]
    }
  ]).then(answers => {
    if (answers.portOpen === 'Nevermind.') {
      debug('OK', 0)
    } else {
      inquirer.prompt([
        {
          name: 'whichPort',
          type: 'input',
          default: qa[answers.portOpen].answer.default,
          message: 'Which port (on your localhost) would you like to forward this to?'
        }
      ]).then(({ whichPort }) => {
        const commandToRun = qa[answers.portOpen].answer.cmd(whichPort)
        const containerName = qa[answers.portOpen].answer.name
        debug(commandToRun)
        debug(`ContainerName: ${containerName}`)
        try {
          const socatContainer = cmd(commandToRun)
          debug(`Successfly running ${socatContainer}`)
          let daemon = child_process.spawn(`${require.resolve('../daemon.js')}`, [containerName.slice(1), socatContainer], {
            detached: true,
            stdio: 'ignore'
          })
          daemon.unref()
        } catch (err) {
          debug(`Something went wrong when attempting to start up the proxy container. This was likely caused by another docker container already using the specified port (${whichPort}).`, 0)
          console.log(err.message)
        }
      })
    }
  })
}

module.exports = main
