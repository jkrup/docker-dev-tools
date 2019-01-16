# Docker Dev Tools

A suite of cli tools to make development with docker a breeze.

Currently mostly focused on npm / nodeJS projects.

## Install with:

```
npm i -g docker-dev-tools
```

This will give you the following **awesome** CLI tools:

- dpm
- dpx 
- dport
- dssh


## DPM
```
dpm
```

Use `dpm` instead of `npm`.

`dpm` is basically an alias for `docker-compose run --rm app npm` so instead of `npm install` you can `dpm install`. 
`dpm start` is a special alias for `docker-compose up` so that you can automatically make use of the port-forwards specified in your docker-compose.yml

If you do not have a `docker-compose.yml` file, a base one can be provided for you with: `dpm init`.

## DPORT

```
dport
```

This lets you forward **running** ports from inside of containers after the fact. It first lists out all open ports that are not being forwarded, and then lets you select a port to forward it to.
