---
title: Event Loop机制解析
date: 2018-08-16 23:08:32
tags:
---

## 基本执行单元

你可以把你的程序都编写在一个单独的.js 文件中，但是整个程序实际上是由许多个代码块，也就是执行单元组成的。当程序执行的当前时间点，永远都会只有一个执行单元在执行，其余的只能在它执行完毕后再执行。在 js 中的执行单元就是函数。

对于刚接触 js 的开发人员来说，有个概念通常比较难理解：在 js 中“稍后”执行并不意味着现在之后马上就可以执行。换句话说，当前不能完成的任务可以异步地完成，但是异步执行的时间点并不是确定的，而这个异步执行同时也意味着不会再有同步所带来的程序阻塞的情况。

```javascript
// ajax(..)是由其他库提供的发起Ajax请求的方法
var response = ajax('https://example.com/api', (response) => {
    console.log(response);
});

console.log('no response yet');
// 打印出的`response`并不是请求返回的数据
```

这是一个 Ajax 请求的常用模式，请求通常是异步执行的，也就是说在执行完`ajax(...)`后只是发出了请求，回调函数中的接收返回值并打印并不会执行，而程序会继续执行 ajax 请求后的代码，只有当随后的所有其余执行单位都结束而且请求也已经返回响应的时候才会执行回调中的代码。

## 分析 Event Loop

尽管 JS 里有各种异步操作，但是实际上直到 ES6 之前，js 自身并没有任何关于异步的内置概念，而 JS 引擎所做的也只是不断地解析和执行代码块。

实际上，JS 引擎并不是单独工作的，它通常在一个宿主(通常也称为运行时，runtime)内部工作，而目前最常见的宿主就是浏览器和 Node。而在所有的这些宿主内部都有一个相同的内置机制，那就是 Event Loop(事件循环)，正是它的存在才使得 JS 单线程的处理方式以及异步操作成为可能。

比如在程序中发起一个 Ajax 的请求从服务器获取一些数据，同时在成功回调中加入获取数据后的一些操作，这时候 JS 引擎就会通知浏览器把回调函数暂时挂起，并在请求携带数据返回时再执行回调函数。然后，浏览器就开始监听发出的请求，一旦有数据返回就会把回调函数交给 event loop 让它在合适的时候交给 JS 引擎进行执行。

如下面图解所示： ![event loop](/img/event_loop_1.png)

图中的 Web APIs，本质上是开发者无法访问的一些线程，你只能调用它所提供给的一些方法。它们是能够执行并发操作的浏览器的一部分，在 Node 中，则是一些 C++ APIs。

**因此，到底什么是 event loop？Event Loop 只有一个工作：监视 Call Stack(调用栈)和 Callback Queue(回调队列)。一旦 Callback Queue 为空，它就会取出回调队列中的第一个事件，然后把它插入 Call Stack 由 JS 引擎执行。**这样的一个工作迭代，在 event loop 中被称为一个**tick**，而存储在 Callback Queue 中的`事件`实际就是一个回调函数。

```javascript
console.log('Hi');
setTimeout(function cb1() {
    console.log('cb1');
}, 5000);
console.log('Bye');
```

上面这段代码的执行步骤如下：

![执行步骤](/img/event_loop_2.gif)

1. 初始阶段，控制台为空，Call Stack 为空
2. `console.log('Hi')`被添加到 Call stack
3. `console.log('Hi')`被执行
4. `console.log('Hi')`被弹出 Call Stack
5. `setTimeout(function cb1() { ... })`添加到 Call Stack
6. `setTimeout(function cb1() { ... })`被执行。浏览器创建了一个定时器，并开始计时
7. `setTimeout(function cb1() { ... })`执行完并被弹出 Call Stack
8. `console.log('Bye')`被添加到 Call stack
9. `console.log('Bye')`被执行
10. `console.log('Bye')`被弹出 Call Stack
11. 在至少 5000ms 之后，计时器停止计时并将回调函数`cb1`插入 Callback Queue
12. Event Loop 将`cb1`从 Callback Stack 中取出并插入 Call Stack
13. `cb1`开始执行，`console.log('cb1')`添加到 Call Stack
14. `console.log('cb1')`被执行
15. `console.log('cb1')`被弹出 Call Stack
16. `cb1`被移出 Call Stack

不过随着 ES6 的发布，event loop 已经被纳入了 JS 规范的领域，从技术上来讲，这就意味着 event loop 的工作将会变成 JS 引擎的职责。这个变化的主要原因是由于 ES6 中引入了 Promise，因为 Promise 需要在 event loop 的队列调度上进行更直接和精细的控制。

## setTimeout 是如何工作的

`setTimeout(...)`并不会自动的将回调函数插入 event loop 的队列，它的执行只负责创建一个计时器 timer。当计时器到期之后，由当前所在的运行时(浏览器或 NodeJs)将回调函数插入 event loop 以便未来的某个 tick 能够将它插入 Call Stack 并执行。

```javascript
setTimeout(myCallback, 1000);
```

上面 setTimeout 的执行并不意味着 myCallback 会在 1000ms 之后执行，而是 myCallback 会在 1000ms 之后被插入 Callback Queue，如果队列中已经存在其他等待执行的事件，那么 myCallback 必须首先要等待其他事件执行完。在一些文章或教程中，经常会看到`setTimeout(callback,0)`这样的代码，用来进行异步立即执行。但实际上，它所做的也只是将 callback 的执行延迟到整个 Call Stack 变空的那一刻，而并不是严格意义上的“立即”执行。

```javascript
console.log('Hi');
setTimeout(() => {
    console.log('callback');
}, 0);
console.log('Bye');

// 打印结果依次为 Hi Bye callbacl
```

## ES6 中的 Jobs

ES6 中引入了一个新概念“Job Queue”(工作队列)。它比 event loop 中的队列优先级更高。在处理 Promise 时最容易接触到这个概念。可以把 Job Queue 理解为一个优先于 Callback Queue 的队列。Call Stack 中的某些异步操作(比如 Promise)并不会产生一个会被添加到 Callback Queue 中的事件，而是添加一个 Job 到 Job Queue 中。而这类 Job 的操作会优先于任何其他等待执行的操作(比如 Callback Queue 中的回调函数)，一旦当前 Call Stack 为空就会马上执行。

一个 Job 在执行的同时也可以继续在 Job Queue 中添加更多的 Job。所以会存在无限循环 Job 的情况，持续不断的添加 Job 导致 Job Queue 永远无法清空，永远都会有 Job 不断添加到 Call Stack 中执行，从概念上来讲，类似于程序中的死循环(比如`while(true){...}`)。

## 回调及其嵌套

回调是目前用来处理异步操作的最为普遍的方式，它也是 JS 程序中一个最为基础的模式。在 ES6 之前，无数的 JS 程序，即使是那些非常复杂的库也都只能采用回调的方式解决异步操作。

如下代码：

```javascript
listen('click', function (e) {
    setTimeout(function () {
        ajax('https://api.example.com/endpoint', (text) => {
            if (text == 'hello') {
                doSomething();
            } else if (text == 'world') {
                doSomethingElse();
            }
        });
    }, 500);
});
```

上面的代码将三个回调函数嵌套在一起，每一个回调函数都代表了一个异步操作。我们首先等待“click”事件触发，然后等待计时器到期后触发回调，最后等待 Ajax 请求的响应以进行最后的操作。类似于这样的代码常被人们称为“回调地狱”，不过这个“回调地狱”的问题并不是嵌套结构所带来的，后面在分析 promise 时会解释明白这一点。

如果把这些步骤从嵌套中拆出来，应该是这样：

```javascript
// 1. 点击事件
listen('click', function (e) {
    // ..
});
// 2.启动定时器
setTimeout(function () {
    // ..
}, 500);
// 3. 发送Ajax请求
ajax('https://api.example.com/endpoint', (text) => {
    // ..
});
// 4. 最后的操作
if (text == 'hello') {
    doSomething();
} else if (text == 'world') {
    doSomethingElse();
}
```

如果代码能按照这种没有嵌套的方式编写，无疑可读性会更好一些。而 ES6 中引入的 的 Promise 就是实现这种以同步方式进行异步编程的方案。

## Promise

```javascript
var x = 1;
var y = 2;
console.log(x + y);
```

在上述代码中，我们执行的是一个简单的求和计算。当 x 和 y 的值都已确定的情况下，计算很简单，但是如果 x，y 的值都不确定呢？比如，x，y 的值都需要从服务器获取，假设 fetchX 和 fetxhY 分别是从服务器获取 x，y 的方法，sum 是对两个值获取到后进行求和的方法。那么整个程序就会像下面这样(可读性显然很糟糕)：

```javascript
function sum(getX, getY, callback) {
    var x, y;
    getX((result) => {
        x = result;
        if (y !== undefined) {
            callback(x + y);
        }
    });
    getY((result) => {
        y = result;
        if (x !== undefined) {
            callback(x + y);
        }
    });
}
// 一个请求X值的方法 可能是同步也可能是异步
function fetchX() {
    // ..
}
// 一个请求Y值的方法 可能是同步也可能是异步
function fetchY() {
    // ..
}
sum(fetchX, fetchY, (result) => {
    console.log(result);
});
```

代码中有一点比较重要就是，x，y 被当作是“future value”(未来值)，而 sum 方法最终在执行时可以不用考虑当前 x，y 是否已经都有了确定的值。当然，这只是一个比较简陋的回调解决方案，但是它能体现“future value”带来的好处：无需考虑这些值的获取过程。

来看下如何用 Promise 对 x+y 进行求值：

```javascript
function sum(xPromise, yPromise) {
    // `Promise.all([ .. ])` 接收一个由promise组成的数组,
    // 返回一个等待数组内所有promises完成的新的promise
    return (
        Promise.all([xPromise, yPromise])

            // 当新的promise resolve之后 同样返回一个数组
            // 数组内包含每个promise的resolved value
            // 然后将这两个值相加
            .then((values) => {
                // `values`就是包含resolved value的数组
                return values[0] + values[1];
            })
    );
}

// `fetchX()` and `fetchY()` 返回两个promise
// 这两个promise的resolved value就是x，y的值
// promise可能立即resoved 也可能随后才能
sum(fetchX(), fetchY())
    // 获取到对两个resolved values相加的promise
    // 然后链式调用then方法 在promise resolve之后对resolved value进行打印
    .then((sum) => {
        console.log(sum);
    });
```

这里有两层 promises，fetchX()和 fetchY()被直接调用，返回的 promises 被擦传入 sum(...)，这些 promises 的值可能会立即获取到也可能在随后才能，但是他们的行为都是一致的，被规范化的。我们以不考虑时间的方式使用 x 和 y 的值，因为我们当他们是“future value”。

第二层就是在 sum(...)执行的过程中由 Promise.all([...])创建的 promise。当 sum(...)执行完，并且 sum 的“future value”已经就绪时，我们就可以将这个值打印出来，从而隐藏了 sum 内等待 x，y“future”的实现细节。

> **Note:** 在 sum(...)执行时，Promise.all([...])会创建一个 promise(等待 promiseX 和 promiseY resolve)。而随后的链式调用`then(...)`实际上会创建另外一个 promise，这个 promise 会在`return values[0]+values[1]`时立即 resolve，resolved value 就是返回的这个相加值。因此第二个`then(...)`实际上是在第二个 promise 基础上的操作，而这个`then`在执行结束后也会返回一个由返回值作为 resolved value 的 promise，只不过我们没有继续对这个 promise 进行操作而已。

对于 Promise，实际上`then(...)`可以接收两个参数，一个是针对 promise resolve 时的函数，另一个是对 promise reject 时的函数。

```javascript
sum(fetchX(), fetchY()).then(
    // fullfillment handler
    (sum) => {
        console.log(sum);
    },
    // rejection handler
    (err) => {
        console.error(err); // bummer!
    }
);
```

如果在获取 x 或 y 时(fetchX 或 fetchY)有报错出现，或者在`values[0]+values[1]`时出现了错误，那么`sum(...)`返回的 promise 就不会 resolve 而最终变成 rejected，这时候上面的`rejection handler`就会执行，参数为 promise 的 rejected value。

因为 Promise 内部封装了对于依赖时间的处理，在使用它时只需要等待一个 resolved value 或者 rejected value，所以在编写程序时，不同的 promises 可以以可预测的方式进行组合，而不用考虑时间或者最终返回的结果。

此外，一个 promise 一旦 resolve，它就会一直保持 resolved 的状态，resolved value 也会保持不变，某种成都上成为一个 immutable value。而且，这个 prmise 随后可以执行监听操作(调用 then 方法)。

promise 的链式调用：

```javascript
function delay(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, time);
    });
}

delay(1000)
    .then(() => {
        console.log('after 1000ms');
        return delay(2000);
    })
    .then(() => {
        console.log('after another 2000ms');
    })
    .then(() => {
        console.log('step 4 (next Job)');
        return delay(5000);
    });
```

在第一个`then(...)`中，返回了一个由`delay(2000)`会创建一个 promise，因为这个 promise 在 2000ms 后才会 resolve，所以第二个`then(...)`中的函数会在 2000ms 后才会开始执行。

> **Note:**因为一个 promise 一旦 resolve 之后状态和值就不再改变，所以可以放心的将 resolved value 传给其他模块，尤其是在多个模块都在监听 promise 的时候，各模块对 promise 的操作相互独立，互不影响。“不可变”是 Promise 中一个非常重要和基础的概念，合理利用这个特性能在程序中发挥巨大功能。

## 捕捉异常

如果在创建 promise 时或者监听处理的时候出现了报错，比如`TypeError`或者`ReferenceError`(类型错误或引用错误)这样的异常，那么这个异常会被捕捉，同时 promise 会被强制转为 rejected。

创建 promise 时报错：

```javascript
var p = new Promise((resolve, reject) => {
    foo.bar(); // 因为没有定义`foo` 所以这里会报错
    resolve(374); // 不会被执行 :(
});

p.then(
    function resolved() {
        // 不会执行 :(
    },
    function rejected(err) {
        // `err`将会是一个`TypeError`类型的异常对象(来自于`foo.bar()时的报错`)
    }
);
```

执行 then 监听时报错：

```javascript
var p = new Promise((resolve, reject) => {
    resolve(374);
});

p.then(
    function resolved(message) {
        foo.bar();
        console.log(message); // 不会执行
    },
    function rejected(err) {
        // 不会执行
    }
);
```

在链式调用 then 方法时如果报错，如上，那么 resolved 方法会在报错时终止并返回一个 rejected promise，而 rejected value 则是对应的异常对象(在这里是`ReferenceError对象`)。如果要捕捉这个异常，那么可以继续链式调用 then 方法进行捕捉，也可以使用 catch 方法进行捕捉，catch 是针对 promise 链中出现异常进行捕捉的专门方法。

```javascript
const p2 = p.then(
    function resolved(message) {
        foo.bar();
        console.log(message); // 不会执行
    },
    function rejected(err) {
        // 不会执行
    }
);

// 使用then捕捉
p2.then(null, (err) => {
    console.log(err);
});

// 使用catch捕捉
p2.catch((err) => {
    console.log(err);
});
```

## 参考资源

-   <https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch2.md>
-   <https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch3.md>
-   <http://nikgrozev.com/2017/10/01/async-await/>

> **原文：**[https://blog.sessionstack.com/](https://blog.sessionstack.com/how-javascript-works-event-loop-and-the-rise-of-async-programming-5-ways-to-better-coding-with-2f077c4438b5)
