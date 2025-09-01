# Certification Function

This function is triggered by a timer every ...

## Starting the Function locally

After cloning the repo, navigate to this folder and run:

`npm run build`

locally start Azurite from VSCode otherwise you get error like:

```
Connection refused (127.0.0.1:10000)) (Connection refused (127.0.0.1:10000)) (Connection refused (127.0.0.1:10000)). Azure.Core: Connection refused (127.0.0.1:10000). System.Net.Http: Connection refused (127.0.0.1:10000). System.Net.Sockets: Connection refused.
```

Load you environment variables from `.env` file:

with `fish` shell: `loadenv`
with `bash` or `zsh` shell: `export $(cat .env | xargs)`

then start with: `func start`

You will see output like:

```
...
15 certificati inseriti nel database con successo.
Executing 'Functions.timerTrigger'...
Timer function processed request.
...
```