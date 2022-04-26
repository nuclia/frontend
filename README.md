
# PUBLIC

## Build browser:

`yarn nx run  public-public:build --configuration local-stage`


## To Run in dev mode:

`yarn nx run  public-public:serve-ssr --configuration local-stage --inspect`

# APP

## To Run against stage

`yarn nx serve app --configuration local-stage`

#
# Desktop app

## Development

To run the frontend in development mode with local proxy

    yarn nx run desktop:serve:local

The will start the app in http://localhost:4200, and it expects the proxy also
running locally. To run the proxy locally (`venv` and `install` steps only the very first time)

    cd {backend_repo}/proxy
    make venv
    make install
    make run

Also, you need to build the `synchronizer` job file before serving/packaging the electron app, otherwise
no task will run. The builder warns you about it, but serve will start the app anyway.

    yarn nx run synchronizer:build

To run the electron app:

    yarn nx run electron:serve:local

This will run the electron app, using the frontend served in the previous step instead of embedding it in
the application


## Distributable application

This will generate the appropiate production packaged app to distribute. Note that
you first need to build each of its parts beforehand, the last step assumes so, otherwise
you'll end up with an application with older versions of its components.

    yarn nx run desktop:build:production
    yarn nx run synchronizer:build
    yarn nx run electron:build
    yarn nx run electron:package
    yarn nx run electron:make

Only the target OS version application will be compiled, you'll find it in `/dist/executables/{platform}`.
From this folder you can run the app without installing it. The installable packages on `/dist/executables`,
the output depends on each platform:

- **macos**: '/dist/executables/Flaps Desltop-x.y.z.dmg'
- **win**: '??'
- **linux**: '??'

## ICons for packaged application

This only needs to be run in case the main icon file on `apps/electron/icons/logo.png` has been updated

    cd apps/electron
    node ./node_modules/electron-icon-builder/index.js --input icons/logo.png --output icons
