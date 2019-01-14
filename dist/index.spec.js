"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

describe('regex', function () {
  it('works', function () {
    var example1 = `Active Internet connections (servers and established)`; // const example2 = `Active Internet connections (servers and established)`

    var regex = new RegExp(/(?:tcp6?|udp) +\w +\w (?:0.0.0.0|::):(\d+)/);
    expect(regex.exec(example1)).toBeNull();
  });
  it('also works', function () {
    var example = 'api_default |8000/tcp,8000;8080/tcp,8080;| 172.27.0.2 74554 47968ed16f912 /api_';
    var example2 = 'api_default || 172.27.0.2 74554 47968ed16f912 /api_';

    var _example$split = example.split(' '),
        _example$split2 = _slicedToArray(_example$split, 6),
        networkName = _example$split2[0],
        portInfo = _example$split2[1],
        ip = _example$split2[2],
        pid = _example$split2[3],
        _id = _example$split2[4],
        name = _example$split2[5];

    var _example2$split = example2.split(' '),
        _example2$split2 = _slicedToArray(_example2$split, 6),
        networkName2 = _example2$split2[0],
        portInfo2 = _example2$split2[1],
        ip2 = _example2$split2[2],
        pid2 = _example2$split2[3],
        _id2 = _example2$split2[4],
        name2 = _example2$split2[5];

    expect(portInfo.slice(1, -1).split(';').filter(function (x) {
      return x;
    }).map(function (x) {
      return x.split(',');
    })).toEqual([['8000/tcp', '8000'], ['8080/tcp', '8080']]);
    expect(portInfo2.slice(1, -1).split(';').filter(function (x) {
      return x;
    }).map(function (x) {
      return x.split(',');
    })).toEqual([]);
  });
});