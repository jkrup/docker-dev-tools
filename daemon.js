#!/usr/local/bin/node

const childProcess = require('child_process')

console.log(process.argv[2])
console.log(process.argv[3])
const containerToMonitor = process.argv[2] // get from args
const socatToKill = process.argv[3] // get from args
const dockerEvents = childProcess.spawn('docker', ['events'], {}) // TODO: Use GO templates for better monitoring

dockerEvents.stdout.on('data', data => {
  const monitor = data.toString().match(new RegExp(`die.*${containerToMonitor}`))
  console.log(monitor)
  if (monitor) {
    childProcess.execSync(`docker rm -f ${socatToKill}`)
    process.exit(0)
  }
})
