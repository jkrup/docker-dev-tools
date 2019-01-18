"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var child_process = require('child_process');

var inquirer = require('inquirer');

var util = require('util');

var debug = require('./debug');

var exec = util.promisify(child_process.exec);

var cmd = function cmd(c) {
  return child_process.execSync(c).toString().trim();
};

var getRunningContainersOrThrowError = function getRunningContainersOrThrowError() {
  var containerIdsRaw = cmd(`docker ps --format '{{.ID}}'`);

  if (containerIdsRaw === '') {
    throw new Error('No running containers');
  }

  return containerIdsRaw.split('\n');
};

var getAdditionalInfoForContainers = function getAdditionalInfoForContainers(containerIds) {
  var commandToGetRunningContainerInfo = `docker inspect --format '{{.HostConfig.NetworkMode}} |{{range $p, $conf := .NetworkSettings.Ports}}{{$p}},{{(index $conf 0).HostPort}};{{end}}| {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}} {{.State.Pid}} {{printf "%.13s" .ID}} {{.Name}}' ${containerIds.join(' ')}`;
  return cmd(commandToGetRunningContainerInfo).split('\n'); // renamed from results
};

var getNetworkInfoForContainersByAdditionalContainerInfo =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(containersInfo) {
    var promises;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // async get network info for each container
            promises = containersInfo.map(function (containerInfo) {
              var _containerInfo$split = containerInfo.split(' '),
                  _containerInfo$split2 = _slicedToArray(_containerInfo$split, 6),
                  networkName = _containerInfo$split2[0],
                  portInfo = _containerInfo$split2[1],
                  ip = _containerInfo$split2[2],
                  pid = _containerInfo$split2[3],
                  _id = _containerInfo$split2[4],
                  name = _containerInfo$split2[5];

              var promise = exec(`docker run --rm -i --privileged --pid=host alpine:latest nsenter -t ${pid} -n -- netstat -pan`).then(function (b) {
                return b.stdout.toString().trim();
              });
              return promise.then(function (p) {
                return {
                  networkName,
                  portInfo: portInfo.slice(1, -1).split(';').filter(function (x) {
                    return x;
                  }).map(function (x) {
                    return x.split(',');
                  }),
                  //this could be || or formatted like |8000/tcp,8000;8080/tcp,8080| becomes [] or [[8000/tcp, 8000], [8080/tcp, 8080]]
                  ip,
                  name,
                  p
                };
              });
            });
            return _context.abrupt("return", Promise.all(promises));

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getNetworkInfoForContainersByAdditionalContainerInfo(_x) {
    return _ref.apply(this, arguments);
  };
}();

var questionAnswerObjectReducer = function questionAnswerObjectReducer(acc, _ref2) {
  var networkName = _ref2.networkName,
      portInfo = _ref2.portInfo,
      ip = _ref2.ip,
      name = _ref2.name,
      p = _ref2.p;
  // get ports from p
  var ports = p.split('\n').map(function (l) {
    var regex = new RegExp(/(?:tcp6?|udp) +\w +\w (?:0.0.0.0|::):(\d+)/);
    return regex.exec(l);
  }).filter(function (x) {
    return x;
  }).map(function (x) {
    return x[1];
  });
  ports.filter(function (port) {
    return !portInfo.some(function (mapping) {
      return mapping[0].split('/')[0] === port;
    });
  }).forEach(function (port) {
    acc[`${networkName} ${ip} ${port}`] = {
      question: {
        name: `${name} ${port} (on network: ${networkName})`,
        value: `${networkName} ${ip} ${port}`
      },
      answer: {
        default: port,
        cmd: function cmd(portToExpose) {
          return `docker run -d --rm -p ${portToExpose}:${port} --network=${networkName} alpine/socat tcp-listen:${port},fork,reuseaddr tcp-connect:${ip}:${port}`;
        }
      }
    };
  });
  return acc;
};

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var containerIds, containersInfo, containersNetworkInfo, qa;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            debug('Starting...'); // Get all running containerIDs

            containerIds = getRunningContainersOrThrowError();
            debug(`Container IDs: ${containerIds}`);
            containersInfo = getAdditionalInfoForContainers(containerIds);
            debug(`Running Containers' Info:\n ${containersInfo}`);
            _context2.next = 7;
            return getNetworkInfoForContainersByAdditionalContainerInfo(containersInfo);

          case 7:
            containersNetworkInfo = _context2.sent;
            debug(`Running Containers' Network Info:\n ${containersNetworkInfo.map(function (x) {
              return JSON.stringify(x);
            }).join('\n')}`); // get ports from p

            qa = containersNetworkInfo.reduce(questionAnswerObjectReducer, {}); // inquirer.prompt([
            // {
            // }
            // ]).then({ whatToDo })

            inquirer.prompt([{
              name: 'portOpen',
              type: 'list',
              message: 'Open a port?',
              choices: [].concat(_toConsumableArray(Object.values(qa).map(function (v) {
                return v.question;
              })), ['Nevermind.'])
            }]).then(function (answers) {
              if (answers.portOpen === 'Nevermind.') {
                debug('OK', 0);
              } else {
                inquirer.prompt([{
                  name: 'whichPort',
                  type: 'input',
                  default: qa[answers.portOpen].answer.default,
                  message: 'Which port (on your localhost) would you like to forward this to?'
                }]).then(function (_ref3) {
                  var whichPort = _ref3.whichPort;
                  var commandToRun = qa[answers.portOpen].answer.cmd(whichPort);
                  debug(commandToRun);

                  try {
                    debug(`Successfly running ${cmd(commandToRun)}`);
                  } catch (err) {
                    debug(`Something went wrong when attempting to start up the proxy container. This was likely caused by another docker container already using the specified port (${whichPort}).`, 0);
                    console.log(err.message);
                  }
                });
              }
            });

          case 11:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _main.apply(this, arguments);
}

module.exports = main;
