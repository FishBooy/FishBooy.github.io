---
title: JS中的操作符和类型转换
date: 2017-02-13 20:00:00
categories:
- [技术,Javascript,ES5]
tags:
- [操作符,类型转换]
---

按照ES5.1的定义，javascript中只包含六种类型：Null、Undefined、Boolean、String、Number、Object（ES6中新增了Symbol类型），类型之间的转换通常分为显式类型转换和隐式类型转换。从代码字面就能显示出要转换的类型，这类转换被称作显式转换。反之，代码中无法明确显示出的类型转换则为隐式转换。

```javascript
//显式类型转换
String(123) // "123"
Number("456") // 456
Boolean("") // false
```

String，Number，Boolean三个全局方法分别会将传入的参数转化为字符串、数值、布尔值，调用这三个方法进行转换就是显式类型转换。

```javascript
//隐式类型转换
var str='123',
    num=123;

str == num // true
str + num // "123123"
if(str){...} // false
```

日常开发中，最常引发隐式类型转换的是操作符（==、<、!、+等）。“==”操作符在对String类型和Number类型的值进行操作时，会首先将String类型的值转化为Number类型的值，然后将两个Number类型的值比较是否相等。“123”转换为Number 类型后是123，因此 123 == 123 会返回true。“+”操作符在作为运算符进行加法操作时，只要两侧值有一侧为String类型，就会把另外一个值转换为String类型，然后将两个字符串进行拼接。数值123在转换为字符串后是“123”，两个“123”拼接得到“123123”。

语句也会产生隐式转换。if 语句会首先把“if(exp){...}”中的exp转换为Boolean类型的值，然后根据得到的值（true/false）决定是否执行{...}中的语句。“123”转换为Boolean类型后是true，即if代码块中的语句会被执行。

在javascript中，类型转换在被提及时实际常侧重于隐式类型转换，因为隐式类型转的隐蔽性使开发人员在编写代码时很容易入坑。以“==”操作符引起的隐式类型转换为例：

```javascript
false == "" // true
false == 0 // true
[] == "" // true
[] == ![] // true
```

这几个“==”操作都发生了隐式类型转化，但是如果没有详细了解过类型转换，就会比较难理解这些true是如何得到的。而关于类型转换规则，ES5.1中是有明确定义的，只要了解了规范中简明易懂的转换规则，就能充分理解javascript中的类型转换从而在实际开发中避免低级失误。

操作符引发的隐式转换是最为普遍的，而在各操作符中“==”操作符的操作过程能够比较全面的展示规范中的类型转换规则，因此首先来看下“==”操作符是如何进行类型转换的。

>**注**：规范中其实并没有“显式”和“隐式”转换的概念，这两个概念只是开发人员根据类型转换时的不同表现形式进行划分而来，毕竟Boolean(123)要比!123（同是转换为Boolean类型的值）明显的多。实际上，如果开发人员完全掌握了转换规则，那么对其而言“隐式转换”这个概念也就相当于不存在了。

## “==”操作符（[查看ES5.1规范原文]()）

“x==y”的比较结果是一个Boolean类型的值（true或false），其比较规则如下：

1. 如果x,y属于同一类型，那么：
    - a. 如果都是Undefined类型则返回true。
    - b. 如果都是Null类型返回true。
    - c. 如果都是Number类型，那么：
        - i. 如果x,y中有一个值为NaN则返回false。
        - ii. 如果x,y是相同的数值则返回true。
        - iii. 如果x是+0或-0，y是-0或+0返回true。
        - iv. 其他情况返回false。
    - d. 如果都是String类型，那么只有在x,y是相同的字符序列（长度相等且字符串中各字符索引也都相同）时才会返回true。否则返回false。
    - e. 如果都是Boolean类型，那么x,y都是true或都是false时才会返回true，否则返回false。
    - f. 如果都是Obejct类型，那么只有在x,y是同一个对象时才会返回true，否则返回false。
2. 如果x,y是null和undefiend的比较则返回true。
3. 如果x,y是String类型和Number类型的比较则会先把String类型转化为Number类型然后再返回比较值。比如，当x是String类型，y为Number类型时，返回的值是由ToNumber(x)==y产生的，反之则是由x==ToPrimitive(y)产生的。
4. 如果x,y中有Boolean类型的值则会先把Boolean类型的值转化为Number类型然后返回比较值。比如，当x是Boolean类型时，返回的值是由ToNumber(x)==y产生的，反之则是由x==ToNumber(y)产生。
5. 当x,y中有一个值为String或Number类型，另一个值为Object类型时，则会先把Object类型的值转化为原始值然后返回比较值。比如：x为String或Number，y为Object类型时，返回的值是由x==ToPrimitive(y)产生的，反之则是由ToPrimitive(x)==y产生的。
6. 其他情况一律返回false。

**NOTE**: “==”操作符在某些情况下是不可传递的。比如：有两个独立的字符串对象，都表示同一个字符串值，那么“每个对象”==“所表示的字符串值”都会返回true，但是这两个对象之间却是不等的。

new String("a") == "a" 和 "a" == new String("a") 都是true
new String("a") == new String("a") 却是false

在上述“==”的整个比较规则中，有两个方法ToNumber、ToPrimitive，这两个方法是类型转换的关键，它们才是实际执行转换的方法，这类负责最终转换的方法在规范中称之为“抽象操作”。接下来看看规范中的抽象操作是如何定义的。

## 规范中的抽象操作（[查看ES5.1规范原文]()）

ECMAScript在运行过程中会根据当前需要自动进行类型转换。为了使这种自动转换成为合理的规范，ES5.1中规定了一系列抽象操作。这些抽象操作并不是ECMAScript语言的一部分，它们的实现属于浏览器底层的范畴，它们在规范中以概念形式存在的意义在于帮助规范制定一个类型转换的规则。

>**注**：这里的ECMAScript指的是依据规范实现的脚本语言如javascript、actionScript等。规范中定义的抽象操作属于底层操作，这些操作是由浏览器内部的引擎在执行javascript程序时完成的，开发人员是无法访问和使用的。

### ToPrimitive

抽象操作ToPrimitive接受两个参数：一个必输的参数input和一个可选参数preferedType。ToPrimitive负责将input转化为原始值（非Object类型的值）。如果input能够转化为多个原始值，则ToPrimitive在操作时会根据preferedType参数把对象转化为一个指定类型的原始值。

>**注**：之所以将非Object类型的值称作原始值，是因为Object类型的值实际上只是非Object类型值的集合。非Object类型也可以叫作“基础类型”或者“基本类型”。Object类型从存储角度通常被叫作“引用类型”，如果单纯从类型角度来讲，个人觉得叫作“复合类型”是比较合适的。

根据ES5.1的规定，ToPrimitive在对非Object类型进行转化时不会进行任何操作而是直接返回接受的参数值作为转化结果，因此ToPrimitive实际是只针对Object类型的一个操作。该抽象操作会调用input（Object类型实例）的内置方法[[DefaultValue]]并传入preferedType作为参数，最终调用结束的返回值就是转化结果。

**[[DefaultValue]](hint)，hint即参数preferedType**

当对象O的内置方法[[DefaultValue]]被调用且参数hint值为String时，具体执行步骤如下：

1. 调用O的[[Get]]方法并传入参数 "toString"，将[[Get]]方法执行的返回值赋值给toString。
2. 如果IsCallable(toString)返回true，那么：
    - a. 执行toString: 以O作为执行时的this，不传入任何参数。toString执行结束后将返回结果赋值给str。
    - b. 如果str是一个原始类型的值，返回str。
3. 调用O的[[Get]]方法并传入参数“valueOf”，调用结束后将执行结果赋值给valueOf。
4. 如果IsCallable(valueOf)返回true，那么:
    - a. 执行valueOf: 以O作为执行时的this，不传入任何参数。valueOf执行结束后将返回结果赋值给val。
    - b. 如果val是一个原始类型的值，返回val。
5. 抛出一个类型异常: TypeError。

当对象O的内置方法[[DefaultValue]]被调用且参数hint值为Number时，具体执行步骤如下：

1. 调用O的[[Get]]方法并传入参数 "toValue"，将[[Get]]方法执行的返回值赋值给toValue。
2. 如果IsCallable(toValue)返回true，那么:
    - a. 执行toValue: 以O作为执行时的this，不传入任何参数。toValue执行结束后将返回结果赋值给val。
    - b. 如果val是一个原始类型的值，返回val。
3. 调用O的[[Get]]方法并传入参数“toString”，调用结束后将执行结果赋值给toString。
4. 如果IsCallable(toString)返回true，那么:
    - a. 执行toString: 以O作为执行时的this，不传入任何参数。toString执行结束后将返回结果赋值给str。
    - b. 如果str是一个原始类型的值，返回str。
5. 抛出一个类型异常: TypeError。

用伪代码表示如下：

```javascript
{
    [[DefaultValue]]: function(hint) {
        if (hint == String || (!hint && this.constructor != Date)) {
            toString = this.[[Get]]('toString');
            if (IsCallable(toString)) {
                str = this.toString();
                //function不是基本类型 是object的子类
                if (typeof str != "object" && typeof str != "function") {
                    return str
                }
            }
            valueOf = this.[[Get]]('valueOf');
            if (IsCallable(valueOf)) {
                val = this.valueOf();
                if (typeof str != "object" && typeof str != "function") {
                    return val
                } else {
                    throw TypeError();
                }
            }
        } else {
            valueOf = this.[[Get]]('valueOf');
            if (IsCallable(valueOf)) {
                val = this.valueOf();
                if (typeof str != "object" && typeof str != "function") {
                    return val
                }
            }
            toString = this.[[Get]]('toString');
            if (IsCallable(toString)) {
                str = this.toString();
                if (typeof str != "object" && typeof str != "function") {
                    return str;
                } else {
                    throw TypeError();
                }
            }
        }
    }
}
```

当对象O的内置方法[[DefaultValue]]被调用且没有传入参数值时，默认将hint值赋值为Number。不过有一个特例，当O是一个Date对象时，hint会被默认赋值String。

规范中的内置方法[[DefaultValue]]只允许返回原始值。如果宿主对象实现了自己的[[DefaultValue]]方法，则必须保证该方法返回原始类型值。

>**注**：[[Get]]是对象的内置方法，用于获取传入的属性名所对应的值（可能是任何类型）。toPrimitive的转换规则简单来讲就是“当对一个对象进行转换时，实际上就是先后调用对象的toString方法或valueOf方法( 顺序由hint值决定)，直至得到原始值(Null,Undefined,Boolean,String,Number)或抛错。即：ToPrimitive(obj)=obj.toString()或obj.valueOf()”。

### ToBoolean

ToBoolean操作接受任何类型的值作为参数并将其转化为一个布尔值，其转化规则如下：

参数类型|转化结果
-|-
Undefined|false
Null|false
Boolean|不会发生转换，返回被转换的参数值
Number|+0、-0、NaN都会被转化为false;其他数值都会转换为true
String|空字符串""（因为其长度为0）会被转化为false;其他字符串值都会转化为true
Object|true

### ToNumber

ToNumber操作接受任何类型的值作为参数并将其转化为一个Number类型的值，其转化规则如下：

参数类型|转化结果
-|-
Undefined|NaN
Null|+0
Boolean|true被转化为1;false会被转化为+0
Number|不会发生转化，返回被转化的参数值
String|转化细节较多，详情查看ES5.1规范原文。常用转化规则为：空字符串“”转换为0，字面值为数值的字符串转化为对应的数值，其他情况返回NaN
Object|转化步骤如下：</br>1. 执行ToPrimitive(input,hint Number)，将返回的原始值赋值给primValue。</br>2. 返回ToNumber(primValue)

### ToString

参数类型|转化结果
-|-
Undefined|"undefined"
Null|"null"
Boolean|true被转化为"true";false会被转化为"false"
Number|转化细节较多，详情查看ES5.1规范原文。常用规则：直接转换为数值字面量的字符串
String|不会发生转化，返回被转化的参数值
Object|转化步骤如下：</br>1. 执行ToPrimitive(input,hint String)，将返回的原始值赋值给primValue。</br>2. 返回ToString(primValue)

### IsCallable

抽象操作IsCallable不涉及类型转换，它主要用来辅助检测传入的参数是否为可调用的函数对象(类型为Object且具有内置属性[[call]])，是返回true，否则返回false。即：IsCallable(x)，只有当x值为函数时才会返回true，其他一律返回false。

>**注**：对于全局方法Boolean、Number、String，当使用new关键字调用时是构造布尔对象、数值对象和字符串对象（Object类型，非原始值）的构造函数，当作为普通函数调用时，它们的执行实际就分别对应了ToBoolean、ToNumber、ToString的操作，比如：Number(true)返回1，实际就等于直接对true进行了ToNumber操作并得到结果1。除了上述五个抽象操作，规范中定义的还有ToObject和ToInteger两个主要抽象操作，介于常规开发比较少会接触到这两个操作，在此不做详细介绍，详情可查看ES5.1规范原文。

在看完规范中对“==”的操作和主要的类型转换抽象操作以后，再来了解一下两个转换规则比较简单的操作符“!”和“+”。

## 逻辑非操作符“!”和一元操作符/加法操作符“+”

### 操作符“!”

“!x”的转换结果为Boolean类型，规则为：

1. 把ToBoolean(x)的结果赋值给oldValue；
2. 如果oldValue为true则返回false,否则返回true;

### 一元操作符“+”

“+x”的转换结果为Number类型，规则为：直接返回ToNumber(x)。

### 加法操作符“+”

“x+y”的转换结果为String类型或Number类型，规则为：

1. 首先把ToPrimitive(x)的结果赋值给lval，把ToPrimitive(y)的结果赋值给rval；
2. 如果lval和rval中有一个是String类型，则把ToStirng(lval)和ToString(rval)拼接起来；
3. 如果lval和rval中没有String类型，则进行加法运算：ToNumber(lval)+ToNumber(rval)。

>**NOTE**: 步骤1中的ToPrimitive操作是不传hint参数的，按照ToPrimitive的默认操作执行。“+”是哪一种操作符取决于表达式的结构，“x+y”中是加法操作符，“+x”中则是一元操作符。

在了解完“==”、“！”，“+”操作符规则以及主要的抽象操作后，再来看本文一开始提到的第三个隐式转换的代码示例：

1. false == ""，false属于Boolean类型因此首先要把false转化为数值，ToNumber(false)  == ""也就是0 == ""，接下来String类型和Number类型比较则需要把String转换为Number，即：0 == ToNumber("")，最后0 == 0自然是返回true。

2. false == 0，这个更简单一些，ToNumber(false) == 0 --> 0 == 0 --> true。

3. \[ ] == ![ ]，![ ] 会首先根据 ! 的操作规则返回ToBoolean([ ])的相反值（[ ]是Object类型），也就是false，然后对 [ ] == false 进行比较，即：[ ] == ToBoolean(false) --> [ ] == 0 --> "ToPrimitive([ ]) == 0 --> [ ].toString( ) == 0 --> "" == 0 -->ToNumber("")==0 --> 0==0 --> true（如上，最后得到true）。

4. \[ ] == ""，ToPrimitive([ ]) == "" --> [ ].toString( ) == "" --> "" == ""  --> true。

## 其他操作符

在操作符的操作规则以及抽象操作的转换规则下，才最终实现了“隐式类型转换”。除了“==”，“！”和“+”再列举以下常用操作符：

### 其他相等操作符（查看ES5.1规范原文）

“!=”：对“x==y”的返回值取反。

“===”：全等操作符（规范中称之为严格等于操作符，strict equals）的比较规则如下：

1. 如果x,y不是同一类型，则返回false；
2. 如果x,y是同一类型则依据“==”操作符在x,y类型相同时的规则进行比较。

“!==”：不全等操作符的比较规则也是遵循了取反规则，即：对x===y的返回值取反。

### 关系操作符“<”（查看ES5.1规范原文）

对于“x<y”：

1. 只要不满足“x,y都是String类型”，那么：把ToNumber(x)的结果赋值给nx，把ToNumber(y)的结果赋值给ny；
    - a. 如果nx，ny中有一个值为NaN，那么返回undefined；
    - b. 如果nx，ny是+0，-0的比较那么返回false；
    - c. 如果nx是正无穷+∞，返回false；
    - d. 如果ny是正无穷+∞，返回true；
    - e. 如果nx是负无穷-∞，返回true；
    - f. 如果ny是负无穷-∞，返回false；
    - g. 如果nx在数值上比ny小则返回true，如果nx和ny相等则返回false。

2. 如果x，y都是String类型，那么：
    - a. 如果x是y的前缀（如果字符串b能由字符串a和其他字符串拼接而成，那么a就是b的前缀，如：“he”是“hello”的前缀），则返回true，如果y是x的前缀则返回false；
    - b. 以k作为索引值从0开始递增，依次比较x和y在k处的字符，如果两个字符相同则继续比较，如果不同则停止比较并把x[k]赋值给px，把y[k]赋值给py；
    - c. 把px，py在ASC II字符码集合中对应的索引数值分别赋值给m、n，返回m<n（都是Number类型）的比较结果。

3. 其他关系操作符

- “>”：对于“x>y”，返回“y<x”的返回值（返回值是undefined时作为false处理）。
- “>=”：对于“x>=y”，返回“x<y”的返回值的相反值（返回值是undefined时作为false处理）。
- “<=”：对于“x<=y”，返回“y<x”的返回值的相反值（返回值是undefined时作为false处理）。

## 结语

javascript中的类型及转换规则是由ECMAScript规范制定的，规范中对各种类型转换规则的定义是比较简明的，只要稍微花些时间充分了解“各操作符的操作规则”和“抽象操作方法”，就能掌握javascript中的隐式转换从而避免一些代码中常见的低级失误。