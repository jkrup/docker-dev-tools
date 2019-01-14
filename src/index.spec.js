describe('regex', () => {
  it('works', () => {
    const example1 = `Active Internet connections (servers and established)`
    // const example2 = `Active Internet connections (servers and established)`
    const regex = new RegExp(/(?:tcp6?|udp) +\w +\w (?:0.0.0.0|::):(\d+)/)
    expect(regex.exec(example1)).toBeNull()
  })
  it('also works', () => {
    const example = 'api_default |8000/tcp,8000;8080/tcp,8080;| 172.27.0.2 74554 47968ed16f912 /api_'
    const example2 = 'api_default || 172.27.0.2 74554 47968ed16f912 /api_'
    const [networkName, portInfo, ip,pid, _id, name] = example.split(' ')
    const [networkName2, portInfo2, ip2,pid2, _id2, name2] = example2.split(' ')
    expect(portInfo.slice(1,-1).split(';').filter(x => x).map(x => x.split(','))).toEqual([['8000/tcp', '8000'],['8080/tcp','8080']])
    expect(portInfo2.slice(1,-1).split(';').filter(x => x).map(x => x.split(','))).toEqual([])
  })
})
