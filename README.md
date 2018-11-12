# Online Checkers Platform API

![Build Status](https://travis-ci.com/spencerturkel/online-checkers-platform-api.svg?token=gm1zuwtz6yWqd9Rwapxf&branch=master)

This is the back-end API supporting https://onlinecheckersplatform.com.

It was developed using TypeScript, Express.JS, AWS DynamoDB, Stripe and SendGrid.

## Project setup

Ensure that an up-to-date version of Node.JS is installed on your system.
Then, in a terminal run:

```
npm install
```

This will install the packages required to build the project.

### Develop script

- Compiles TypeScript as files are changed
- Runs the compiled files as they are changed, with debugging enabled
- Runs unit tests as files are changed

```
npm run develop
```

### Build

```
npm run build
```

This command packages the application for deployment in the `dist` folder.
The application may then be run using `node dist/index.js`.

Travis CI is used to automatically deploy the latest version of the project from
the `master` branch on GitHub to AWS Elastic Beanstalk, a service which
automatically provisions a server to host the API.

### Unit and Integration Tests

```
npm run test:unit
```

This command runs the tests scripted in `.spec.ts` files in the `src` folder.

The Game component contains unit tests that verify the implementation of the game
of checkers. This is the sole place in the application where there is a significant
amount of business logic which is decoupled from the system boundaries, so unit
tests are most effective here.

The other components of the application all interact with the system boundaries
too much to warrant the isolation that unit testing requires.
These components are tested using a package named SuperTest to run integration
tests against the full Express server.
