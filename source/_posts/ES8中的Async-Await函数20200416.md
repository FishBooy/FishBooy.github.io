---
title: ES8中的async函数[译]
date: 2020-04-16 21:28:56
tags:
---

Promise 让开发者能够以按顺序执行的书写方式更方便的处理异步操作。而 ES8 中新增的 async 函数则能够让开发者以完全同步的方式处理异步操作。虽然使用 Promise 和 generator 函数也能够实现和 async 函数相同的功能，但是 async 函数封装了许多内部操作，使得开发者能够以更少的代码去处理异步操作。

## 代码示例

在下面的例子中，我们首先声明了一个返回 promise 的函数，该 promise 会在 2s 后以 🤡 转到 resolved 状态。然后我们声明了一个 async 函数，并且在函数内使用 await 等待 promise 直到 resolved，一旦 resolved 则立刻打印 resolved value 也就是 msg。

```javascript
function scaryClown() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('🤡');
        }, 2000);
    });
}

async function msg() {
    const msg = await scaryClown();
    console.log(`Message: ${msg}`); // Message:🤡 <-- after 2 seconds
}
```

> await 是 ES8 中新增的操作符，用来等待一个 promise 完成(resolve)或被拒绝(reject).它只能在 async 函数内使用。

使用 async 函数的优势在进行多个异步操作的时候体现的更为明显。

```javascript
function who() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('🤡');
        }, 200);
    });
}

function what() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('lurks');
        }, 300);
    });
}

function where() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('in the shadow');
        }, 500);
    });
}

async function msg() {
    const a = await who();
    const b = await what();
    const c = await where();

    console.log(`${a} ${b} ${c}`);
}
msg(); // 🤡 lurks in the shadow <-- after 1 second
```

不过需要注意的是，上面代码中 a，b，c 三个变量的赋值操作是同步执行的，也就是说每个生成 promise 的方法要等到上一个 已经生成的 promise 完成或被拒绝后才开始执行。如：who()返回的 promise 在 200ms 后 resolved，则 what 就需要在 200ms 之后才开始执行。如果需要将这些 promise 同时操作，可以使用 Primise.all 方法，该方法会等待所有的 promise 完成。

```javascript
async function msg() {
    const [a, b, c] = Promise.all([who(), what(), where()]);
    console.log(`${a} ${b} ${c}`);
}
msg(); // 🤡 lurks in the shadow <-- after 500ms
```

一旦传入的所有 promise 都完成了，Promise.all 就会返回一个由所有 resolved values 组成的数组。

## 返回 Promise

Async 函数总会返回一个 promise，因此下面的代码并不会产生类似普通函数所预期的结果：

```javascript
async function hello() {
    return 'Hello Alligator';
}
const b = hello();
console.log(b); // Promise {...}
```

基于 async 函数返回的是一个 promise，你可以进行如下操作：

```javascript
async function hello() {
    return 'Hello Alligator!';
}

// 等同于hello().then(x => console.log(x));
const b = hello();
b.then((x) => console.log(x)); // Hello Alligator!
```

## 创建 async 的不同形式

目前在代码示例中，我们只用函数声明的方式创建了 async 函数。同样的，我们也可以用函数表达式和箭头函数来创建 async 函数。

### async 函数表达式

```javascript
const msg = async function () {
    const msg = await scaryClown();
    console.log(`Message: ${msg}`);
};
```

### async 箭头函数

```javascript
const msg = async () => {
    const msg = await scaryClown();
    console.log(`Message: ${msg}`);
};
```

## 错误捕捉

async 函数另一个对开发者友好的地方在于，它可以通过 try...catch 语句以同步的方式进行错误捕捉和处理。下面的例子用一个 rejected promise 展示了 async 函数的错误处理：

```javascript
function yayOrNay() {
    return new Promise((resolve, reject) => {
        const val = Math.round(Math.random() * 1); // 0 or 1, at random
        val ? resolve('Lucky!!') : reject('Nope 😠');
    });
}

async function msg() {
    try {
        const msg = await yayOrNay();
        console.log(msg);
    } catch (err) {
        console.log(err);
    }
}

msg(); // Lucky!!
msg(); // Lucky!!
msg(); // Lucky!!
msg(); // Nope 😠
msg(); // Lucky!!
msg(); // Nope 😠
msg(); // Nope 😠
msg(); // Nope 😠
```

因为 async 函数最终返回的是一个 promise，所以你同样口可以使用 promise 的 catch 方法进行错误捕捉，如下：

```javascript
async function msg() {
    const msg = await yayOrNay();
    console.log(msg);
}
msg().catch((x) => console.log(x));
```

## async 函数搭配 Promise 式 API

使用原生的 Promise 式 API 与 async 函数组合可以方便的写出异步操作，如：

```javascript
async function fetchUsers(endpoint) {
    const res = await fetch(endpoint);
    let data = await res.json();

    data = data.map((user) => user.username);
    console.log(data);
}

fetchUsers('https://jsonplaceholder.typicode.com/users');
// ["Bret", "Antonette", ... "Moriah.Stanton"]
```

> Fetch 是新增的 web API，它以 Promise 的工作方式进行异步请求，从而避免了使用 XMLHttpRequest 所带来的许多冗余代码。

> 原文：<https://alligator.io/js/async-functions/>
