# Kansas

*Usage limited API to go!*

[![Build Status](https://secure.travis-ci.org/thanpolas/kansas.png?branch=master)](http://travis-ci.org/thanpolas/kansas)

Kansas will take care of the API usage accounting for you. It will track your API's usage using tokens with usage limits based on monthly fixed periods. You define policies, create tokens and consume them. Kansas uses Redis and works out of the box.

[Read the full documentation][docs]

If you plan on using Kansas with Express then you need to [check out the kansas-express package](https://github.com/thanpolas/kansas-express).

## Installation

Install the module from npm 

```
npm install kansas --save
```

```javascript
var kansas = require('kansas');

var api = kansas();
```

## Getting Started

There are three parts you need to understand and you are ready to get started with Kansas.

* Policies
* Token Creation and Consumption
* Maintenance

### Policies

Policies are your plans. You can create as many as you wish and you will use them when creating tokens. Each policy defines the following properties:

* **Name** The policy name, i.e. "free", "basic", "advanced", "ultimate".
* **Max Tokens** The maximum number of tokens an owner can create.
* **Limit** The maximum number of API calls (units) per period.
* **Period** The time period, for now it's fixed to *Monthly*, there's the ability to have daily periods too, maybe in a later version.

Policies are stored in memory. After many iterations it became apparent that this is the most convenient way to work with policies. You define and maintain them inside your application, they are shared between multiple cores and exist in the memory saving on needless database reads. After all, typically an application is not expected to have more than 10 policies.

### Token Creation and Consumption

That's pretty straightforward, you create tokens and consume them. Each token requires an `ownerId` and a `policyName`. The `ownerId` can be any string that identifies the owning entity of the token, a user, a company, anything. The `policyName` must match a previously created policy.

Each token creation will create a set of key/value pairs of various types for various reasons, i.e. indexing. Kansas will properly clean up all created keys when a token is deleted and will do so atomically.

From the keys created, the ones you should care about are the *Usage* type of keys. Kansas will create the current and next period's usage keys with every token created. Which means that for every new month an operation needs to run to populate the usage keys for the next month. This brings us to the next part, *maintenance*.

### Maintenance

As described above, on each new month you need to populate the usage keys for the next month. Kansas didn't want to take any initiatives with that as depending on how many tokens you have registered it can be an expensive operation.

So Kansas will kindly offer you a method to run yourselves so it can properly populate next month's usage keys.

These are the main concepts you need to understand, now you are ready to dive into the API!

[Read the full documentation][docs]

## Release History

- **v0.1.14**, *29 Feb 2014*
    - More defence on db prepopulation for corrupt records
- **v0.1.12**, *11 Feb 2014*
    - Upgraded to logg 0.3.0, enables multi-package logger instances.
- **v0.1.11**, *09 Feb 2014*
    - Better error message on Redis version incompatibility.
- **v0.1.10**, *09 Feb 2014*
    - Fix policy period to month.
    - Allow for creation of custom tokens.
    - Will now check if token exists before creating it.
- **v0.1.8**, *08 Feb 2014*
    - Improve Logging piping.
- **v0.1.7**, *03 Mar 2014*
    - Master switch for logging on testing.
    - Optimize prepopulation method, fix context bug, add more debug logging.
    - Introduce logger unmute and addConsole.
    - Expose "removeListener" method.
    - Export logger.
- **v0.1.6**, *03 Mar 2014*
    - Better conditional for determining usage of DECR vs DECRBY
- **v0.1.5**, *02 Mar 2014*
    - Fix bug with prepopulate.
- **v0.1.4**, *02 Mar 2014*
    - Upgrade all packages to latest.
- **v0.1.3**, *02 Mar 2014*
    - Better connection management to redis
    - Protect against older versions or Redis that wont work with Kansas (require 2.8.x+)
- **v0.1.2**, *02 Mar 2014*
    - More defence on prepopulate method.
- **v0.1.0**, *02 Mar 2014*
    - Big Bang

## License

Copyright (c) 2014 Thanasis Polychronakis. Licensed under the MIT license.

[docs]: https://github.com/thanpolas/kansas-docs/blob/master/README.md
