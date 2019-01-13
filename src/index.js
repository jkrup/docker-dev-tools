const child_process = require('child_process')
const inquirer = require('inquirer')
const util = require('util')

const debug = require('./debug')

const exec = util.promisify(child_process.exec)

const cmd = (c) => child_process.execSync(c).toString().trim()

const getRunningContainersOrThrowError = () => {
  const containerIdsRaw = cmd(`docker ps --format '{{.ID}}'`)
  if (containerIdsRaw === '') {
    throw new Error('No running containers')
  }
  return containerIdsRaw.split('\n')
}

const getAdditionalInfoForContainers = (containerIds) => {
  const commandToGetRunningContainerInfo = `docker inspect --format '{{.HostConfig.NetworkMode}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}} {{.State.Pid}} {{printf "%.13s" .ID}} {{.Name}}' ${containerIds.join(' ')}`
  return cmd(commandToGetRunningContainerInfo).split('\n') // renamed from results
}

const getNetworkInfoForContainersByAdditionalContainerInfo = async (containersInfo) => {
  // async get network info for each container
  const promises = containersInfo.map(containerInfo => {
    const [networkName, ip, pid, _id, name] = containerInfo.split(' ')
    const promise = exec(`docker run --rm -i --privileged --pid=host dnst nsenter -t ${pid} -n netstat -pan`).then(b => b.stdout.toString().trim())
    return promise.then(p => ({
      networkName,
      ip,
      name,
      p
    }))
  })

  return Promise.all(promises)
}

const questionAnswerObjectReducer = (acc, { networkName, ip, name, p }) => {
  // get ports from p
  const ports = p.split('\n').map(l => /(?:tcp6?|udp) +\w +\w (?:0.0.0.0|::):(?<port>\d+)/gm.exec(l)).filter(x => x).map(x => x.groups.port)

  ports.forEach(port => {
    acc[`${networkName} ${ip} ${port}`] = {
      question: {
        name: `${name} ${port} (on network: ${networkName})`,
        value: `${networkName} ${ip} ${port}`
      },
      answer: {
        default: port,
        cmd: (portToExpose) => `docker run -d --rm -p ${port}:${portToExpose} --network=${networkName} alpine/socat tcp-listen:${portToExpose},fork,reuseaddr tcp-connect:${ip}:${port}`
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
    }
  ]).then({ whatToDo })
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
        debug(commandToRun)
        debug(cmd(commandToRun))
        debug(`Successfly running ${cmd(commandToRun)}`)
      })
    }
  })
}

module.exports = main
