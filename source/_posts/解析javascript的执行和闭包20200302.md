---
title: 解析javascript的执行和闭包
date: 2017-06-19 20:00:00
categories:
- [技术,Javascript,Code Machanism]
tags:
- [Javascript]
- [AST]
- [闭包]
---

ECMAScript规范是javascript的实现标准，6.0版本(简称ES6.0)在2015年正式发布，虽然到目前为止已经应用的比较广泛，但是基于一些比较明显的原因，比如：

(1). ES6.0增加了许多新特性，它代表了新一代的javascript实现标准，这些新变化导致了浏览器的支持并不全面(支持情况参考这里)，各浏览器对同一特性的实现也存在差异；
(2). ES6.0中的一部分概念只是基于5.1版规范的语法糖，如class等；

这些原因的存在导致了目前的规范应用普遍都基于开发环境而非生产环境，生产中的规范依然是目前各浏览器支持度最高最稳定的5.1版本(简称ES5.1)。从2011-ES5.1发布至2015-ES6.0发布的这段时间内，javascript这门语言得到了长足的发展并直接推动了web前端变革性的进步，这一切的发展也都是以ES5.1为基石的。

规范会有版本的迭代，但是核心的原理和概念都会保持一致，充分的理解ES5.1规范有助于更好的理解和拥抱未来的ES6.0。本文的主旨就在于完全依据ES5.1解析javascript中代码的执行流程和机制以及与此紧密相关的“闭包”的概念，部分概念会穿插ES6.0或更早版本ES3.0进行对比说明。

## 1. 代码的执行

在浏览器中运行的javascript代码，是以`<script>`标签为运行单位的，也就是说：js引擎会在执行完当前`<script>∏`标签中编写或引入的代码之后才会以相同的处理方式去执行下一个`<script>`中的代码块，直到执行完当前窗口中所有的js代码。

```html
<script type="text/javascript" src="js/public.js"></script>
<script type="text/javascript">
    //全局代码
    var str = "Hello world!";
    function foo(){
        //函数代码
        console.log(str);
    };
    foo();
</script>
```

对于`<script>`标签对中的代码来说，通常根据代码所处的位置分为：全局代码和函数代码。不管是全局代码还是函数代码，其执行实际上都是由两步来完成的：先进行预处理-->然后代码自上而下地执行，不过在此之前，js引擎首先要做的是对`<script>`中的整个代码块进行代码编译，这是接下来进行预处理和代码执行的必要前提。

### 1.1 代码编译

传统的编译性语言能够对源码进行提前编译，编译分两个步骤完成：

1. (1) 通过词法分析(Tokenizing)和语法分析(Parsing)构建出源码所对应的抽象语法树(Abstract Syntax Tree，简称AST);

2. (2) 根据AST进行代码优化并根据优化后的代码生成CPU能够直接执行的指令文件如".exe"。指令文件生成后，由源码编写的程序就可以正常运行了，而且之后程序的重新启动或运行不需要再次进行编译。

而javascript属于解释性语言，编译阶段的任务就是通过词法分析和语法分析构建出源码所对应的抽象语法树AST。构建出AST之后的操作，不同的js引擎会有不同的处理，主流的处理方式可以分为两类:

(A) 根据AST生成中间码交给引擎内的解释器进行解释后再由CPU执行(以Firefox中的OdinMonkey为代表)；

(B) 引擎根据AST直接生成机器码交给CPU执行(以Chrome中的V8为代表)。虽然两类处理方式有差异，但是相同之处在于：整个过程都不再额外生成固定的指令文件。没有了指令文件，代码每执行一次就需要提前编译一次，不过javascript的编译发生在代码执行前的几微妙甚至更短的时间，因此在浏览器环境中实际运行js代码时是很难觉察到编译的存在的。

#### 1.1.1 词法分析

词法分析阶段的工作是把源代码作为一段字符串分解成有意义(对于javascript来说)的字符，这些分解出的代码字符叫作词法单元(token)。分解完后会生成一个词法单元对象集合tokens，每个词法单元对象都包含了该token的类型(type)和值(value)。

```javascript
//变量声明
var name = "Calvin";
```

这样一行变量声明的代码会生成的tokens为：

```javascript
[{"type": "Keyword", "value": "var" },
 {"type": "Identifier", "value": "name" },
 {"type": "Punctuator", "value": "=" },
 {"type": "String", "value": "\"Calvin\"" }]
 ```

#### 1.1.2 语法分析

语法分析阶段会根据tokens中各token的类型和token之间的关系形成反映整个程序语法的树状结构，也就是语法树AST。AST中的每个节点都有一个节点类型"type"，一段代码的根节点是"Program"，下面的二级节点有：VariableDeclaration(变量声明)，FunctionDeclaration(函数声明)，ExpressionStatement(表达式语句)，IfStatement(if语句)等，不同的二级节点下面又会有VariableDeclarator(声明符)，Identifier(标志符)等子节点。以上面的tokens集合为例，经过语法分析，它对应的语法树，用JSON来表示应该是：

```javascript
{
    "type": "Program",
    "body": [
        {
            "type": "VariableDeclaration",
            "declarations": [
                {
                    "type": "VariableDeclarator",
                    "id": {
                        "type": "Identifier",
                        "name": "name"
                    },
                    "init": {
                        "type": "Literal",
                        "value": "Calvin",
                        "raw": "\"Calvin\""
                    }
                }
            ],
            "kind": "var"
        }
    ],
    "sourceType": "script"
}
```

而代码的语法检查也是在进行词、语法分析的过程中进行的，当代码中存在语法错误时会导致AST无法生成而报错：`Uncaught SyntaxError...`(在浏览器的控制台中会有错误的详细提示)，报错发生后会跳出当前所在的代码片段去处理下一段`<script>`包含的代码。

对于现在的web来讲，实际页面中引用或编写的代码体积往往是非常大的，因此这些代码对应的AST结构也是非常复杂的。不过有许多开源的解析器可以将源码的tokens，AST以json或节点树的形式展现出来，如[Esprima](https://github.com/jquery/esprima)或者[Uglifyjs](https://github.com/mishoo/UglifyJS2)。

当代码编译完成（也就是AST构建成功且js引擎根据AST生成可供CPU直接执行的机器码）之后，就可以开始进行预处理和代码执行的工作了。实际上，源码只是提供给引擎进行编译，“预处理”和“代码执行”这两步其实是计算机执行机器码(由引擎根据AST生成)的过程。

### 1.2 预处理: 创建执行环境

执行环境(Execution Context，也叫作执行上下文，简称EC)。预处理发生在代码编译之后，代码执行之前，它是属于js引擎操作的范畴在源码中是无法体现的，开发者也无法在源码中编写预处理相关的代码，因此本文中用来说明预处理阶段操作的代码都属于伪代码。

预处理的工作就是根据已构建的AST创建EC，可以把EC理解为一个对象，它包含了当前代码在执行时所需要的全部数据。全局代码和函数代码，分别与之对应的EC为全局执行环境和函数执行环境。一个完整的EC由词法环境(LexicalEnvironment)、变量环境(VariableEnvironment)、this绑定(ThisBinding)三部分组成。

在了解EC的每个组成部分的意义及其具体内容之前，需要先了解一下javascript代码的执行机制：整个代码块的执行过程实际上就是由全局执行环境开始，然后不断的进出各个函数执行环境，最后又返回到全局环境的过程，整个执行流相当于一个不断变化的栈式结构。

```javascript
//全局代码
var greet="Hello";
const test = '';
function saySomething(sth){
    //函数代码
    console.log(sth);
    console.log('fuck');
}
saySomething(greet);
greet+=" everybody!";
```

把整个执行流的栈式结构用数组的形式来理解，以上代码在执行阶段执行流的变化如下：

```javascript
//开始执行全局代码,当前的执行环境为全局
EC_Stack=[];
EC_Stack.push(global_EC); //[global_EC]

//函数被调用,此时在函数内部，当前执行环境为为函数执行环境
EC_Stack.push(saySomething_EC);//[global_EC,saySomething_EC]

//调用结束，当前执行环境重回全局
EC_Stack.pop();////[global_EC]
```

代码编译结束后，首先对全局代码进行预处理—创建全局执行环境global_EC，预处理结束后开始执行全局代码，当全局代码执行到saySomething(greet)后函数被调用，进入函数后进行函数内的预处理，执行环境saySomething_EC被创建，创建完成后开始执行函数内代码即console.log...。函数执行结束后EC_Stack弹出saySomething_EC，执行权重新交给全局，继续执行全局代码greet+=...。

在了解代码的执行机制以后，再来看每个执行环境各组成部分的具体内容都是什么以及这些内容是如何形成的：

首先看下[ECMA-262-5.1](http://ecma-international.org/ecma-262/5.1/)中的定义:
[**Table1—Execution Context State Components**](http://ecma-international.org/ecma-262/5.1/#sec-10.3)

Component | Purpose
-|-
**LexicalEnvironment** | Identifies the Lexical Environment used to resolve identifier references made by code within this execution context.
**VariableEnvironment** | Identifies the Lexical Environment whose environment record holds bindings created by VariableStatements and FunctionDeclarations within this execution context.
**ThisBinding** | The value associated with the this keyword within ECMAScript code associated with this execution context

#### 1.2.1 词法环境

词法环境(LexicalEnvironment，简称LE),每个执行环境都有与之对应的LE，它由环境记录(Environment Record，简称ER)和一个值可能为null的外层词法环境的引用(outerER，简称outer)组成。

可以把ER理解为一个集合，它保存了执行环境下代码中所有变量和函数的声明，变量或函数的名称作为属性名，值作为属性值。实际上这些声明之所以能被存入ER就在于代码编译时生成的AST，js引擎是根据AST查到当前的执行环境对应的全局或某函数节点，然后找到该节点下所有的变量声明VariableDeclaration和函数声明FunctionDeclaration，最后才将这些节点对应的名和值保存到ER中。

全局执行环境的ER就是当前的浏览器窗口对象window，全局代码中的所有变量和函数声明都会被作为window对象的属性保存其中。除此之外，与函数环境不同的是：window对象中还包含了一些内置的属性，比如用于数学计算的(window.)Math对象、用于表示整个html文档节点的(window.)document对象等。

函数中的ER在初始化后首先会有一个arguments属性，该属性指向函数的参数信息对象，该对象包含了参数个数(length)、当前函数的引用(callee)两个属性以及等同于参数个数的"参数索引 : 传入的参数值"这样的键值对。

```javascript
function sum(x,y){
    console.log(x + y)
}
sum(10,20);
```

sum调用后产生的“执行环境->环境记录->arguments对象”如下：

```javascript
sum_EC.LE.ER.arguments = {
    0: 10,
    1: 20,
    callee: <f sum(x,y)>, //即函数add
    length: 2
}
```

因为函数执行环境是在函数调起之后才创建的，所以如果函数定义时有形参且调用时有参数值传入，那么ER还将会添加等同于参数个数的属性，以形参名为属性，以调用时传入的参数值为属性值，如果调用时没有传入值则ER中对应属性值为undefined，本质上形参和函数内的变量声明是相同的。最后，在函数代码中的变量和函数声明也作为ER属性保存其中。

outer保存了对执行环境的外层执行环境中LE的引用。对于整个浏览器窗口来说，全局执行环境是最外层的执行环境，它的外层没有其他执行环境，所以outer为null。对于函数来说，如果函数在全局代码中定义，那么函数执行环境的外层执行环境就是全局执行环境，outer就会指向全局执行环境的LE；如果说函数在另一个函数中定义，那么它的外层执行环境则是包含它的函数的执行环境，outer则指向包含函数的LE。

```javascript
var a = 3,b = 4;
var foo = function(){
    console.log("Hello world!")
}
function add(x,y){
    var str="Get result:",
        z=x+y;
    function foo(){}
    console.log(str+z);
}
add(a,b);
```

执行环境及变量对象如下：

```javascript
//全局执行环境:在全局代码执行前创建
global_EC = {
    LE: {
        ER: {
            //全局环境中声明的变量和函数
            a: undefined,
            b: undefined,
            foo: undefined,
            add: <f add(x,y)>,
            //window对象的内置属性
            alert: <f alert()>,
            Math: <Math object>,
            //...
        },
        outer: null,
    }
}
// 函数执行环境:add调用后(即全局代码开始真正执行并执行到add(a,b)处时)
// 在函数代码执行前创建
add_EC = {
    LE: {
        ER: {
            arguments: <Arguments(2)> //此处为arguments对象的简写方式
            x: 3,
            y: 4,
            str: undefined,
            z: undefined,
            foo: <f foo()>
        },
        outer: global_EC.LE
    }
}
```

global_EC作为全局执行环境它的ER是window，同时全局代码中的函数声明add和变量a,b,foo的声明都被添加到了global_EC.LE.ER中。add_EC作为函数执行环境，由于是在函数被调用并进入函数内之后创建的，函数的调用 add(a,b) 分别对x,y进行了赋值，所以add_EC不仅包含了两个属性x,y且值分别为数值3,4。

观察这两个执行环境会发现：add_EC中的foo和global_EC中add的属性值都是各自的函数引用，但两个ER中的其他变量却是undefined，其实这样的结果来源于js引擎对ER的属性填充规则：

1. 如果是函数执行环境，因为执行环境是在函数调用后创建所以形参会首先被添加到ER并以调用时传入的值作为属性值；

2. 接下来，函数声明会优先被添加到ER且值保持为函数的引用。函数声明的优先性还体现在：函数声明会覆盖同名变量添加进ER；

3. 最后，所有用var声明的变量填充到ER，因为真正的赋值是发生在代码执行阶段的，所以在现阶段(预处理)这类变量被赋默认值undefined。有一点需要注意：所有未用var进行声明的变量在代码执行前都不会添加到ER中，只有在被执行到时才会添加到全局执行环境的ER中（针对的是声明且赋值，其他求值表达式都会在执行时报错）。

#### 1.2.2 变量环境

变量环境(VariableEnvironment，简称VE)，在EC初始化创建完成后，VE和LE的实际上指向同一个值。他们的区别在于：VE在创建后是不会改变的，但是LE有可能会在代码真正执行的阶段发生改变。这时候再查看上述Table1中对两者用途的定义：

组件|用途
-|-
**LexicalEnvironment**|指向由执行环境下的代码所产生的用于标识符解析的*Lexical Environment*
**VariableEnvironment**|指向环境记录完全由代码中的函数声明和变量声明所组成的*Lexical Environment*

定义中“用途”中的Lexical Environment指的是包含outer和ER两个属性的数据实体，LexicalEnvironment则指的是执行环境中对Lexical Environment的一个引用，也就是值和键的关系。为区别这两个概念，文中的“LE”一律代指LexicalEnvironment，而LEObj则代指Lexical Environment。

用一个例子来看一下VE和LE的区别：

```javascript
function foo(){
    var name="Calvin",
        age=20,
        country:"China";
    console.log(name,age,country); // "Calvin 20 China"

    var girl={
        name:"Debby",
        age:18
    }
    with(girl){
        console.log(name,age,country);// "Debby 18 China"
    }

    console.log(name,age,country)//"Calvin 20 China"
}
foo();
```

在foo的整个执行过程中：

```javascript
//全局
global_EC={
    LE:{
        ER:window,
        outer:null
    }
};
global_EC.VE=global_EC.LE;

//进入foo,执行至第一处console时
foo_EC={};
foo_EC.LE={
    ER:{
        arguments: <Arguments(0)>
        name:"Calvin",
        age:20,
        country:"China"
    },
    outer:global_EC
}
foo_EC.VE=foo_EC.LE;

//with语句传入对象girl时
older_LE=foo_EC.LE;
foo_EC.LE={
    ER:girl,
    outer:older_LE
};

//with执行结束，代码继续执行至第三处console时
foo_EC.LE=older_LE;

//foo执行完毕 调用栈弹出foo_EC并销毁
foo_EC=null;
```

LE和VE的区别进一步解释的话就是：LE.ER在代码预处理阶段是记录代码变量声明和函数声明，但是在代码执行阶段如果有with、catch语句时，就会改变而指向新值：对于with来讲是with(obj)中的obj，对于catch(e)来讲则是{e:someValue}，不过在with和catch执行结束后，LE则会恢复原来的引用和VE保持一致。VE.ER则始终是由代码中的函数和变量声明所组成的(在预处理阶段形成后不再改变)。

为什么with和catch会使得词法环境发生改变，原理如下：

在讲述预处理的开始部分提到过“预处理属于js引擎范畴在源码中是无法体现的”，这句话的具体含义在于：执行环境包括其包含的词法环境、变量环境，对于开发者来说都是不可见的，无法在代码编写阶段去访问和使用这些数据，它们只对浏览器内的js引擎可见，引擎创建了它们并使用它们实现程序的执行，因此本文中关于执行环境及其组成部分的表示都属于伪代码，不过引擎处理过程中的基本原理和伪代码的表达是基本保持一致的。

尽管无法完全的操作和访问真实的执行环境，但with和catch语句提供了一个有趣的可能性。以with为例，with在执行时会创建一个新的LEObj，并将新LEObj的outer引用指向当前执行环境的词法环境，将with(obj){...}中的obj赋值给LEObj的ER，最后把with当前所处的执行环境中的LE指向新创建的这个LEObj。这个时候执行环境中环境记录ER的不可能被访问就变成了可能，对象obj实际上就是with代码块在执行时的执行环境中的ER,访问obj就是在访问ER(上述with示例代码中的对象girl就是ER)，这种以对象形式在代码中可见的ER在ES5.1规范中称之为对象式环境记录(object environment records，简称OER)，另外一个OER便是window，每一个在全局环境下声明的变量和函数都可以以window对象属性来访问，比如上述代码中的foo( )实际上就相当于window.foo( )。相对于ORE，真正无法被访问的ER则称之为声明式环境记录(declarative environment records，简称DER)，函数执行环境中的环境记录就是典型的DER（上述代码中的foo_EC.LE.ER）。

catch语句创建新LE的流程和with保持一致。两者的区别在于：catch(e)所创建的新词法环境中的ER(即{e:someValue})是声明式环境记录DER，可以把catch(e)当作函数的传参过程来理解。

#### 1.2.3 ThisBinding

代码执行时this关键字所指向的对象。全局代码中的this指向window对象。而在函数中的this则要根据具体情况分析，this可能是window也可能是某个已经创建的对象甚至函数自身，简单来讲就是this的执行取决于函数如何被调用。

示例代码中global_EC和add_EC的this都指向window对象。calculator在调用时，实际上是作为window对象的属性进行调用的：window.calculator(...)，所以函数的this指向了window。

以上文的add_EC为例，一个完整的执行环境应该如下：

```javascript
//add函数被调用,函数代码执行前
add_EC = {
    LexicalEnvironment: {
        EnvironmentRecord: {
            arguments: <Arguments(2)> //此处为arguments对象的简写方式
            x: 3,
            y: 4,
            str: undefined,
            z: undefined,
            foo: <f foo()>
        },
        outer: global_EC.LE
    },
    VariableEnvironment:{...} //和LexicalEnvironment指向相同,
    ThisBinding:window
}
```

清楚了执行环境的创建及其包含的数据之后，有一点需要再次申明：执行环境中语法环境和变量环境的创建依据是编译阶段生成的AST。js引擎根据执行调用栈的机制，进入当前的执行环境后在AST中查询环境对应的节点，将子节点下各标志符（变量名、函数名）复制到当前EC的ER之中作为属性，如果子节点是函数声明则要将子节点下函数值填充到ER中作为属性值，如果子节点是函数的形参则要将传入的参数值作为属性值(没有传入则属性值为undefined)，其他情况则属性值统一设置为undefined。

至此，在编译的基础上，预处理也已经完成：执行环境已经根据AST完整的创建，它所包含的三个属性也为接下来的代码执行准备好了所有数据。也就是说，现在已经做好了代码执行前的所有准备工作。

### 1.3 开始执行

最后的代码执行阶段才是开发人员编写的源码的目的所在，但在原理上讲：从预处理开始实际上就已经是CPU在处理机器码(依据源码生成)的范畴了，这一阶段的执行同样也是在执行机器码。

代码执行实际就是对各种变量进行各种操作，而只要是和变量有关的操作都会产生对变量的引用。引用也可以理解为查询和使用两个动作的联合，变量引用只有两种LHS（left hand side）和RHS(right hande side)，即求地址和求值。

```javascript
var greet,anotherGreet;
function foo(){
    greet = "Hello";// 对greet的LHS引用
    anotherGreet = greet;//对于anotherGreet来说是LHS引用,对于greet来说是RHS引用
}
foo();// 对foo的RHS引用
```

虽然两种引用是以left side和right side命名，但其实和左右侧并无关联，只不过是在赋值操作符"="两侧的时候能比较明显的显示出两种引用的区别。LHS引用指的是查询该变量的地址，赋值操作会产生LHS(查询到该变量并使用该变量作为容器以存放新值)，上面对greet和anotherGreet的赋值就是LHS。RHS引用指的是查询到该变量保存的具体值并使用这个值去进行一些操作，"var anotherGreet=greet"对greet产生的就是RHS引用，即：查到greet保存的具体值，并把这个值赋给anotherGreet。

在ES5.1中，这种变量的引用叫作标识符解析(Identifier Resolution)，标识符解析完全依赖于执行环境中的词法环境(预处理阶段产生)。规范中对标识符解析的定义如下：

> Identifier resolution is the process of determining the binding of an Identifier using the LexicalEnvironment of the running execution context.

因此在代码执行过程中产生的变量引用，不管是LHS还是RHS，都完全依赖于当前的执行环境的词法环境，查询首先从当前执行环境的LE.ER中进行，如果未找到会进入outer引用即外层执行环境的LE中查找，如果在外层执行环境的LE.ER中查不到则进入外层执行环境的LE.outer引用中继续查询，直至最外层执行环境全局执行环境中的ER即window对象(因为全局执行环境的LE.outer为null，所以到全局执行环境后不论是否查询到都会停止查询，查询到则返回地址或值，查询不到则报错)。这种靠outer引用联接起来的链式结构叫作作用域链，而各层执行环境中的ER则是作用域的一种具象，因此“全局作用域”指的就是全局执行环境中的ER，"函数foo的作用域"指的则是foo的执行环境中的ER，“变量x的作用域”则指的是变量x所在的词法环境以及其所有内层执行环境的词法环境依靠outer联接形成的层级结构，也就是x能够被查询到的作用域集合。

作用域的核心就是ER，所有的ER都是根据AST来生成的，而AST则是依据编写好的源码生成的，所以javascript中的作用域实际上是由源码的编写所决定(with、catch除外)。这种在代码还未执行阶段就已经固定(依靠语法树实现)的作用域叫做词法作用域或静态作用域。

代码的执行过程通常也是修改当前执行环境的词法环境的过程。以预处理的示例代码为例，代码执行完后词法环境的环境记录如下：

```javascript
//全局代码执行结束后:
global_EC = {
    LE: {
        //ER实际上就是添加了新属性的window对象
        ER:{
            //全局环境中的变量和函数
            a: 3,
            b: 4,
            foo: <f foo(){...}>,
            add: <f add(x,y){...}>,
            //window对象的所有默认属性
            alert: ...
            //...
        },
        outer: null
    }
    this:window
}
//函数内代码执行后:
add_EC = {
    LE: {
        ER: {
            arguments: <Arg>
            x: 3,
            y: 4,
            str: "Get Result:",
            z: "Get Result:7",
            foo: <f foo(){...}>
        },
        outer: global_EC.LE
    },
    this:window
}
```

对比在预处理阶段生成的执行环境：global_EC.LE.ER的a,b,foo属性，add_EC.LE.ER的str,z属性分别被赋予了非undefined值。代码在执行阶段给变量赋值，实际上就是对执行环境的环境记录的属性进行赋值，这也证明了变量操作的根基在于执行环境。

结合预处理阶段词法环境对象中属性的填充规则以及变量在作用域链中的访问机制，参考如下代码：

```javascript
//在变量赋值前访问
console.log(country);//undefined
console.log(province);//Uncaught ReferenceError: province is not defined
console.log(city);//Uncaught ReferenceError: city is not defined
console.log(add);//<f add(){...}>

//变量赋值&函数声明
var country = "China";
    province = "Shandong";
var add = "hello";

function add(x,y){
    return x+y;
}

//赋值后访问
console.log(country,province,add);//"China" "Shandong" "hello"
```

顶部的每一个console.log在执行时，代码中声明的所有变量都还没有进行过赋值操作，所以log方法调用后在查询country,province...时，实际上就是在全局执行环境的词法环境的环境记录即window对象中查找这些属性的初始值，这种(依赖于预处理阶段生成的词法环境)不用等到用var声明或函数声明语句执行就可以提前访问变量或函数的现象在很多文档中也称作变量提升(Hoisting)。province没有用var声明，所以预处理时不会被添加进LE.ER，和没有声明的city效果是一样的，console.log执行的时候是查不到的，所以报错：ReferrenceError(引用错误)，这里的引用指的是console.log方法要获取并打印province/city的值。

不过有一点：没有用var声明而直接进行赋值的变量在赋值操作执行后都会被默认添加到window对象下，作为window对象的属性存在即填充全局环境的环境记录ER，只不过没有在预处理阶段而是在执行时才发生。比如上面的province="Shandong"，如果在赋值前访问province会报错，执行过后再访问就已经是值为"Shandong"的全局变量了。

因为函数声明的优先性，add在预处理阶段作为函数添加到环境记录中而不是字符串"hello"。不过在后面的代码执行阶段，当执行到var add="hello"时，环境记录中的add就会被赋值操作覆盖为字符串"hello"。

代码的执行结束对于全局代码和函数代码来讲有很大区别：

**函数**：代码执行结束之后，函数执行环境会被弹出执行栈并被销毁，执行流重新返回到外层的执行环境，可能是外层函数的执行环境也可能是全局执行环境。函数再次调用时又会重新生成新的执行环境，重复创建、执行和销毁的过程。

**全局**：全局代码的执行结束不会对全局执行环境产生影响，因为window对象是打开窗口后由浏览器所创建，所以只有在当前浏览器窗口被关闭时或程序崩溃时才会被销毁。

## 2. 关于闭包

### 2.1 闭包的概念

相比抽象的定义，代码能够更清楚直接地解释什么是闭包：

```javascript
//在变量赋值前访问
function foo(){
    //标记位置1
    var str="Hello world",
        arr=[1,2,3];
    function innerA(){
        //标记位置3
        return arr;
    }
    var innerB=function(){};
    //标记位置2
    return innerA;
}

var getArr=foo();

console.log(getArr());//[1,2,3]
```

在上文分析预处理时有对于javascript执行机制的解释，执行流的方向是由外层执行环境进入内层执行环境，内外执行环境彼此独立，但是内层可以依靠outer访问外层数据，外层却无法访问内层数据。基于此，函数内的数据(变量和函数)是无法被外部所访问的仅供函数内代码使用，在函数执行完毕后整个执行环境不再有使用价值(垃圾回收机制)而被销毁。

也就是说，`foo`执行完毕后(`var getArr=foo( );`)，foo内的执行环境( 包含内部的词法、变量环境和thisBinding)都是要销毁的，函数内的数据即`foo_EC.LE.ER`( 字符串str和数组arr)无法再被访问。但是实际情况则是：通过foo返回的innerA函数依然能够访问到数组arr。函数在执行完毕后，其作用域依然存在且能够被访问，这就是javascript中的“闭包”。

### 2.2 闭包的原理

看完代码，我们从抽象的原理层面来分析闭包的产生：

在上文阐述执行环境中的词法环境时，我们知道函数执行环境中的词法环境会用outer属性指向外层执行环境的词法环境即：`innerA_EC.LE.outer=foo_EC.LE`。但其实词法环境引用的传递基于一个重要的操作，而这个操作正是javascript中闭包产生的关键所在，这个操作如下：

```javascript
//在foo内innerA被创建时:
innerA.[[scope]]=foo_EC.LE

//函数innerA被foo返回，且被全局变量getArr引用并执行,进入函数后首先进行预处理:
innerA_EC.LE.outer=innerA.[[scope]];
```

整个引用传递的机制详情如下：

1. 函数的创建。对于不同的函数定义方式，函数的创建时机也是不同的。对于函数声明，在外层执行环境的预处理阶段(外层执行环境构建完毕后)就已经完成函数的创建。而对于函数表达式，则是在代码执行期间才完成函数的创建。
在javascript中，函数也是对象，在函数对象的创建过程中，其内置属性[[scope]]会保存函数创建时所在的作用域，准确的说是会指向函数创建时所处的执行环境的词法环境。[[scope]]对外层词法环境的引用的意义在于：只要这个函数没有被销毁，外层的词法环境就会一直被引用着而不会被销毁。

```javascript
//foo的预处理阶段(可理解为标记位置1)
foo_EC.LE.ER={
    arguments:<Arguments(0)>,
    str:undefined,
    arr:undefined,
    innerB:undefined,
    innerA:<f innerA()>, //函数声明在预处理阶段就完成创建
    ...
}
foo_EC.LE.ER.innerA.[[scope]]=foo_EC.LE;

//foo代码执行阶段,var innerB=function(){}执行后(标记位置2)
foo_EC.LE.ER={
    arguments:Arguments(0),
    str:'Hello world'
    arr:[1,2,3],
    innerB:<f innerB()> //函数表达式则需要在变量赋值被执行后才得以创建
    innerA:<f innerA()>
}
foo_EC.LE.ER.innerB.[[scope]]=foo_EC.LE;
```

函数foo虽然执行完毕，但是innerA函数被返回并赋给了getArr，因此innerA并没有被销毁，innerA的[[scope]]指向的“foo的词法环境”也就不会销毁，函数foo的作用域就被保存了下来。

2. 函数的调用。函数被创建后才能被调用，被调用后函数开始预处理（也就是开始构建函数执行环境），这时函数的[[scope]]指向就会被传递给函数词法环境的outer属性以完成整个词法环境的构建。

```javascript
//getArr(),进入函数首先预处理(可理解为标记位置3)
getArr_EC.LE.ER={ //innerA_EC===getArr_EC
    arguments:<Arguments(0)> //因为函数内没有变量和函数声明所以只有arg对象
}
getArr_EC.LE.outer=getArr_EC.[[scope]] //即foo_EC.LE
```

当`getArr`函数执行`return arr;`时开始依据作用域链对`arr`进行变量查询(RHS)，`getArr`自己的作用域(`getArr_EC.LE.ER`)显然查询不到，因此通过outer在外层作用域中找，结果在`foo_EC.LE.ER`中找到了`arr:[1,2,3]`,最后将数组返回交给log进行打印。即：函数`foo`虽然已经执行结束，但是`getArr`在`foo`外部(`innerA`在函数外的另外一个标识)的执行依然成功访问了其词法环境。

### 2.3闭包的定义

由于看待角度的不同，各种书籍或网络上对闭包都有不同的定义，比如：

(1) MDN WebDoc中的定义 ，显然是从原因角度分析的。

> **A closure is the combination of a function and the lexical environment within which that function was declared.**(闭包就是函数与其创建时所在词法环境的组合。)

(2) Kyle Simpson所著《You-Dont-Know-js》中的定义，则显然是从现象角度分析的。

> **Closure is when a function is able to remember and access its lexical scope even when that function is executing outside its lexical scope.**(当一个函数能记住并访问它所处的词法作用域时就产生了闭包，即使函数是在词法作用域之外执行的。)

定义的不同只是侧重点的不同，只要理解正确，对于闭包的整体阐释仍然是高度一致的。我们最开始用代码解释闭包的时候所说的“函数在执行完毕后其作用域依然存在且能被访问”也偏重于现象角度。当知道了闭包的原理和所产生的结果之后，我们可以这样解释闭包：

在javascript中，函数的特殊属性使其能够记住其创建时所在执行环境的的词法环境，当离开该执行环境并执行时仍然能够访问其词法环境的这一过程就叫做“闭包”。

## 结语

对于javascript中代码的执行，“栈式执行结构”和“执行环境”、“标识符解析”是三个比较核心的概念，充分理解这几个概念是掌握javascript执行原理的基础。

词法环境是执行环境的核心组成部分，也是作用域的具象表示，程序中的标识符解析（变量查询）要靠它来完成，在ES5.1之前也就是ES3.0中，这个相同的概念规范术语上称之为变量对象(Variable Object，针对全局执行环境)和活动对象(Activation Object，针对函数执行环境)。

闭包可以看做是函数和作用域链共同作用的产物，它属于javascript编程的基础理论并不算是高级技巧，它的意义在于其广泛的应用而不在于概念本身。闭包的广泛应用使其成为了开发者实现程序运行的一个重要手段，当前各种“模块”工具（比如requireJs）的实现基础就是闭包。要彻底了解闭包，不仅需要知道如何使用，更应该知道这种现象得以发生的背后原理。

## 参考

- [ECMA-262-5](http://ecma-international.org/ecma-262/5.1/#sec-10.2)
- [抽象语法树在 JavaScript 中的应用](https://tech.meituan.com/2014/10/08/the-practice-of-abstract-syntax-trees-in-javascript.html)
- [Understanding ASTs by Building Your Own Babel Plugin](https://www.sitepoint.com/understanding-asts-building-babel-plugin/)
- [Advanced working with functions](https://javascript.info/advanced-functions)
