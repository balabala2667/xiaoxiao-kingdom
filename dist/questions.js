const rand = (a, b, rng) => a + Math.floor(rng() * (b - a + 1));
export function shuffle(a, rng = Math.random) { const out = [...a]; for (let i=out.length-1;i>0;i--) { const j=Math.floor(rng()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; } return out; }
function numberQuestion(text, answer, explanation, topic, rng) {
  const choices = new Set([String(answer)]);
  for (const d of shuffle([-10,-2,-1,1,2,10],rng)) { if (answer+d >= 0) choices.add(String(answer+d)); if (choices.size === 4) break; }
  return { text, answer:String(answer), options:shuffle([...choices],rng), explanation, topic };
}
export function mathQuestion(settings, rng = Math.random) {
  const {grade,semester,difficulty} = settings;
  const level = {easy:0,normal:1,nightmare:2}[difficulty];
  const g = Number(grade), s = Number(semester), variant = rand(0,3,rng);
  if (g === 2 && s === 2 && variant < 2) {
    const divisor=rand(2,9,rng), quotient=rand(2,9,rng), remainder=level===2?rand(1,divisor-1,rng):0, total=divisor*quotient+remainder;
    if (level === 0) return numberQuestion(`${total} ÷ ${divisor} = ？`,quotient,`${divisor} × ${quotient} = ${total}，所以商是 ${quotient}。`,'表内除法',rng);
    return numberQuestion(`有 ${total} 颗珠子，每 ${divisor} 颗穿一串，最多能穿几串？`,quotient,`${divisor} × ${quotient} = ${divisor*quotient}${remainder?`，还剩 ${remainder} 颗，不够再穿一串`:'，刚好用完'}。`,'平均分与有余数除法',rng);
  }
  if (g === 2 && s === 1 && variant < 2) {
    const a=rand(2,9,rng),b=rand(2,9,rng),extra=rand(1,8,rng);
    if (level === 0) return numberQuestion(`${a} × ${b} = ？`,a*b,`${a} 个 ${b} 相加，得 ${a*b}。`,'表内乘法',rng);
    if (level === 1) return numberQuestion(`每盒有 ${a} 支笔，${b} 盒一共有多少支？`,a*b,`求 ${b} 个 ${a} 是多少，用乘法：${a} × ${b} = ${a*b}。`,'乘法应用',rng);
    return numberQuestion(`有 ${b} 盒笔，每盒 ${a} 支，又买来 ${extra} 支。现在一共有多少支？`,a*b+extra,`先算盒里的笔：${a} × ${b} = ${a*b}；再加 ${extra}，得 ${a*b+extra}。`,'两步应用',rng);
  }
  if (g === 2 && s === 2 && variant === 2) {
    const h=rand(1,8,rng),t=rand(0,9,rng),u=rand(0,9,rng),answer=h*100+t*10+u;
    if(level<2) return numberQuestion(`${h} 个百、${t} 个十和 ${u} 个一，合起来是多少？`,answer,`${h} 个百是 ${h*100}，${t} 个十是 ${t*10}，再加 ${u}，得 ${answer}。`,'万以内数的认识',rng);
    return numberQuestion(`一个数比 ${answer} 多 100，这个数是多少？`,answer+100,`百位增加 1，十位和个位不变：${answer} + 100 = ${answer+100}。`,'数位与大小',rng);
  }
  if (g === 1 && s === 2 && variant === 0) {
    if(level===0) { const t=rand(1,9,rng),u=rand(0,9,rng); return numberQuestion(`${t} 个十和 ${u} 个一合起来是多少？`,t*10+u,`${t} 个十是 ${t*10}，再加 ${u}，就是 ${t*10+u}。`,'100 以内数的认识',rng); }
    const ten=rand(1,5,rng),one=rand(1,9,rng),pay=ten+rand(1,3,rng);
    return numberQuestion(`一支笔 ${ten} 元 ${one} 角，付 ${pay} 元，应找回多少角？`,(pay-ten)*10-one,`1 元 = 10 角。${pay} 元是 ${pay*10} 角，减去 ${ten*10+one} 角，找回 ${(pay-ten)*10-one} 角。`,'认识人民币',rng);
  }
  const max=g===1?(s===1?(level===0?10:20):100):100;
  let a,b,answer,text,explanation;
  if(g===1 && s===1 && level===2) {
    a=rand(5,12,rng); b=rand(1,20-a,rng); const c=rand(1,a+b,rng); answer=a+b-c;
    text=`树上有 ${a} 只鸟，又飞来 ${b} 只，后来飞走 ${c} 只。还剩几只？`;
    explanation=`先加后减：${a} + ${b} = ${a+b}，${a+b} − ${c} = ${answer}。`;
  } else if (g===1 && s===2) {
    // Limit grade-one operations to two-digit +/- one-digit or whole tens.
    a=rand(2,8,rng)*10+rand(1,9,rng); b=variant===1?rand(1,9,rng):rand(1,Math.min(9,Math.floor(a/10)),rng)*10;
    const add=variant===1 && a+b<=100; answer=add?a+b:a-b;
    text=level===2?`小队有 ${a} 名士兵，${add?'又来了':'离开了'} ${b} 名。现在有多少名？`:`${a} ${add?'+':'−'} ${b} = ？`;
    explanation=`${a} ${add?'+':'−'} ${b} = ${answer}。计算时注意个位与十位。`;
  } else {
    a=rand(2,max-1,rng);b=rand(1,variant%2? a : max-a,rng);const add=variant%2===0;answer=add?a+b:a-b;
    text=level===0?`${a} ${add?'+':'−'} ${b} = ？`:`小明有 ${a} 张卡片，${add?'又得到':'送出'} ${b} 张，现在有多少张？`;
    explanation=`${add?'合起来用加法':'去掉一部分用减法'}：${a} ${add?'+':'−'} ${b} = ${answer}。`;
    if(g===2 && level===2) { const c=rand(1,Math.max(1,answer),rng),restock=answer===0; text=`图书角有 ${a} 本书，${add?'新添了':'借出了'} ${b} 本，又${restock?'新添':'借出'} ${c} 本，现在还有几本？`;explanation=`先算 ${a} ${add?'+':'−'} ${b} = ${answer}，再算 ${answer} ${restock?'+':'−'} ${c} = ${restock?answer+c:answer-c}。`;answer+=restock?c:-c; }
  }
  return numberQuestion(text,answer,explanation,level===2?'综合应用':g===1&&s===1?'20 以内加减法':'加减法重难点',rng);
}
// Original exercises, not reproduced textbook questions. Each row:
// difficulty (0/1/2), topic, prompt, correct answer, distractors, explanation.
export const CHINESE = {
 '1-1':[
 [0,'汉语拼音','“妈”的拼音是哪一个？','mā','má|mǎ|mà','“妈”读第一声 mā。'],
 [0,'识字','“日”表示什么？','太阳','月亮|大山|河水','“日”与太阳有关。'],
 [0,'反义词','“大”的反义词是？','小','多|高|上','大和小意思相反。'],
 [0,'汉语拼音','哪一个是声母？','b','a|o|e','b 是声母，a、o、e 是单韵母。'],
 [0,'识字','“木”加一横可以变成哪个字？','本','日|口|人','“本”比“木”多一横。'],
 [0,'量词','一（　）人，应填哪个字？','个','条|只|本','人常用量词“个”。'],
 [1,'易混字','“白云”的“白”和哪个字不同？','百','白|白|白','“百”比“白”上面多一横。'],
 [1,'组词','哪个词语搭配正确？','小鸟','小天|小云|小日','“小鸟”是正确的词语。'],
 [1,'反义词','“上”和“下”的关系，与哪一组相同？','多和少','人和口|日和月|山和水','上下、多少都是反义词。'],
 [1,'拼音声调','“小马”的“马”读第几声？','第三声','第一声|第二声|第四声','马的拼音是 mǎ，读第三声。'],
 [1,'笔画','“二”字有几画？','两画','一画|三画|四画','“二”由两个横组成，共两画。'],
 [1,'量词','一（　）小鱼，应填？','条','本|朵|片','鱼用量词“条”。'],
 [2,'阅读理解','小鸟在树上唱歌，小鱼在水里游。谁在水里？','小鱼','小鸟|小兔|小猫','句子说“小鱼在水里游”。'],
 [2,'句子理解','“我比弟弟高。”谁矮一些？','弟弟','我|一样高|无法知道','我比弟弟高，所以弟弟矮一些。'],
 [2,'看句选词','天黑了，天上出现了（　）。','月亮','小草|石头|课桌','月亮会出现在夜晚的天空。'],
 [2,'分类识字','哪一组都表示自然事物？','山、水、日','人、桌、椅|笔、本、书|门、床、灯','山、水、日都是自然事物。'],
 [2,'阅读理解','小白先洗手，再吃饭。小白先做什么？','洗手','吃饭|睡觉|读书','“先洗手”告诉我们第一步是洗手。'],
 [2,'句意理解','“门前有三棵树。”这句话告诉我们什么？','树的数量','树的颜色|树的年龄|树的名字','“三棵”说明树的数量。']
 ],
 '1-2':[
 [0,'偏旁','“河”的偏旁是？','三点水','提手旁|口字旁|单人旁','“河”的左边是三点水，常与水有关。'],
 [0,'反义词','“远”的反义词是？','近','高|低|快','远与近意思相反。'],
 [0,'量词','一（　）花，应填？','朵','条|头|本','花用量词“朵”。'],
 [0,'形近字','眼（　），应该填哪个字？','睛','晴|请|清','“睛”有目字旁，与眼睛有关。'],
 [0,'标点','“你叫什么名字”末尾用什么标点？','？','。|，|、','这是问句，句末用问号。'],
 [0,'词语搭配','（　）的草地，哪个最合适？','绿绿','蓝蓝|圆圆|尖尖','草地常常是绿绿的。'],
 [1,'形近字','（　）水，应选哪个字？','清','晴|睛|请','清水的“清”是三点水。'],
 [1,'多音字','“快乐”的“乐”读什么？','lè','yuè|yù|luò','表示高兴时，“乐”读 lè。'],
 [1,'词语搭配','哪一项搭配正确？','一棵大树','一条大树|一本大树|一朵大树','树木的量词用“棵”。'],
 [1,'句子补充','小朋友（　）地跑过来。','飞快','雪白|弯弯|碧绿','“飞快”可以描述跑的速度。'],
 [1,'偏旁识字','“拍、打、拉”都和什么有关？','手的动作','天气|颜色|声音','三个字都有提手旁，都表示手的动作。'],
 [1,'反义词','哪组词意思相反？','早—晚','花—草|风—雨|江—河','早和晚是一组反义词。'],
 [2,'阅读理解','下雨了，小红把伞借给小明，自己和妈妈合打一把伞。谁用了借来的伞？','小明','小红|妈妈|爸爸','小红把伞借给了小明，所以小明用借来的伞。'],
 [2,'句子排序','哪句话的顺序正确？','我在公园里跑步。','跑步我在公园里。|在我跑步公园里。|公园里跑步在我。','按“谁—在哪里—做什么”组织句子。'],
 [2,'形近字运用','今天是（　）天，我们去看（　）水小河。','晴、清','清、晴|睛、请|请、睛','晴与天气有关，清与水有关。'],
 [2,'阅读理解','小猫找了一圈，没有找到球。后来它在床下发现了球。球在哪里？','床下','门外|树上|桌上','最后一句告诉我们球在床下。'],
 [2,'句意理解','“我已经写完作业了。”说明什么？','作业完成了','还没开始写|正在写第一题|忘了作业','“已经……了”表示事情完成。'],
 [2,'礼貌表达','你想借同桌的橡皮，怎么说合适？','请把橡皮借给我，好吗？','快给我！|你的橡皮归我了。|我不问就拿。','借东西要礼貌询问，得到同意再使用。']
 ],
 '2-1':[
 [0,'量词','一（　）石桥，应填？','孔','只|棵|朵','“一孔石桥”是常见的量词搭配。'],
 [0,'反义词','“认真”的反义词是？','马虎','仔细|用心|努力','认真和马虎意思相反。'],
 [0,'词语搭配','（　）的眼睛，哪个最合适？','明亮','响亮|响声|明天','“明亮”能形容眼睛。'],
 [0,'多音字','“银行”的“行”读什么？','háng','xíng|hàn|hǎng','银行是机构名称，“行”读 háng。'],
 [0,'部首','“松”的部首是？','木','公|八|口','松树是树木，松的部首是木。'],
 [0,'形近字','（　）领红领巾，应选哪个字？','戴','带|待|代','这里表示把物品加在身体上，用“戴”。'],
 [1,'词语辨析','哪句话用词正确？','小鸟展开翅膀。','小鸟打开翅膀。|小鸟张开衣服。|小鸟展开树枝。','“展开翅膀”搭配恰当。'],
 [1,'多音字','“教书”的“教”读什么？','jiāo','jiào|jiǎo|jiao','表示把知识传授给别人时，这里读 jiāo。'],
 [1,'句式','“湖水像一面镜子。”把湖水比作什么？','镜子','玻璃杯|大海|白云','“像一面镜子”把湖水比作镜子。'],
 [1,'近义词','“著名”的近义词是？','有名','无名|普通|陌生','著名与有名意思相近。'],
 [1,'标点','“这朵花真美呀”末尾最适合用？','！','？|，|、','表达赞美的感叹语气，用感叹号。'],
 [1,'词语分类','哪一个与其他三个不是同一类？','松树','喜鹊|麻雀|燕子','其他三个都是鸟类，松树是植物。'],
 [2,'阅读理解','风把纸船吹到了岸边，小宇捡起纸船，放回水里。纸船最后在哪里？','水里','岸边|书包里|桌上','最后一个动作是“放回水里”。'],
 [2,'句式转换','“小明把门关上了。”与哪句话意思相同？','门被小明关上了。','门把小明关上了。|小明被门关上了。|小明没有关门。','转换把字句和被字句，做事的人与对象不变。'],
 [2,'词语运用','小树（　）长高了，不是一天长成的。','慢慢地','突然|马上|立刻','树长高是逐渐发生的，用“慢慢地”。'],
 [2,'阅读推理','小鹿跑得比小兔慢，比小熊快。谁跑得最快？','小兔','小鹿|小熊|一样快','速度顺序是小兔、小鹿、小熊。'],
 [2,'句子理解','“只要认真练习，就能进步。”强调了什么？','认真练习很重要','不练习也行|进步只靠运气|练习没有用','前半句给出进步需要的条件：认真练习。'],
 [2,'词语辨析','“大家都赞同这个办法。”说明大家怎样？','都同意','都反对|没听见|不知道','赞同就是赞成、同意。']
 ],
 '2-2':[
 [0,'近义词','“寻找”的近义词是？','寻觅','丢失|离开|放下','寻找和寻觅都表示找。'],
 [0,'反义词','“温暖”的反义词是？','寒冷','暖和|舒服|明亮','温暖与寒冷意思相反。'],
 [0,'词语搭配','（　）的柳条，哪个最合适？','细长','方正|坚硬|滚圆','柳条通常细而长。'],
 [0,'偏旁识字','“炒、烧、烤”大多和什么有关？','火','水|金属|走路','这些字都有火字旁。'],
 [0,'多音字','“一行字”的“行”读什么？','háng','xíng|hàn|xiàng','表示行列时，“行”读 háng。'],
 [0,'词语辨析','“立刻”表示什么？','马上','很久以前|慢慢|偶尔','立刻表示马上、立即。'],
 [1,'修饰词','小朋友高兴（　）跳起来。','地','的|得|着','“地”连接表示状态的词与动作：高兴地跳。'],
 [1,'修饰词','这只小兔跑（　）很快。','得','的|地|着','动作后面说明程度，用“得”：跑得很快。'],
 [1,'词语结构','哪一个词与“明明白白”的结构相同？','开开心心','越来越好|一心一意|火红火红','明明白白和开开心心都是 AABB 结构。'],
 [1,'句式','“一片片树叶像小船。”把什么比作小船？','树叶','大树|河流|小鸟','句子的主语“树叶”被比作小船。'],
 [1,'词语辨析','“他终于学会游泳了。”哪个词表现经过了努力或等待？','终于','他|游泳|了','“终于”表示经过过程后得到了结果。'],
 [1,'字义','“甜津津”通常描写什么？','味道','颜色|声音|形状','“甜”是味觉感受，甜津津描写味道。'],
 [2,'阅读理解','小草弯下了腰，大树摇动树枝，地上的落叶飞起来了。可能发生了什么？','刮风了','下雪了|结冰了|天亮了','弯腰、摇动和落叶飞起，都提示有风吹过。'],
 [2,'阅读理解','小雨忘带彩笔，同桌把自己的彩笔分给她一起用。你觉得同桌怎样？','乐于助人','很马虎|很生气|不守时','同桌主动分享，帮助别人解决困难。'],
 [2,'因果关系','因为路上积水，所以大家绕路走。大家为什么绕路？','路上积水','想去游泳|走错方向|天气太热','“因为”后面交代了原因。'],
 [2,'句子排序','种花的正确顺序是哪一个？','挖坑→播种→盖土→浇水','浇水→盖土→挖坑→播种|盖土→播种→浇水→挖坑|播种→浇水→盖土→挖坑','先挖坑播种，再盖土浇水。'],
 [2,'理解词义','“听到好消息，她眉开眼笑。”她的心情是？','高兴','难过|害怕|生气','眉开眼笑形容高兴愉快的样子。'],
 [2,'提取信息','图书馆周一休息，周二到周日开放。哪一天不能去借书？','周一','周二|周六|周日','“周一休息”说明那天不开放。']
 ]
};
// Replace two distractor-heavy prototype rows with clean, distinct options.
CHINESE['1-1'][6] = [1,'易混字','哪个字比“白”上面多一横？','百','日|目|自','“百”比“白”上面多一横，注意区分形近字。'];
CHINESE['2-1'][5] = [0,'形近字','（　）红领巾，应选哪个字？','戴','带|待|代','把物品加在身体上，用“戴”：戴红领巾。'];
export class QuestionDeck {
 constructor(settings, rng = Math.random) { this.settings={...settings}; this.rng=rng; this.queue=[]; this.revisit=[]; this.index=0; this.last=''; }
 next() {
  this.index++;
  const due=this.revisit.findIndex(x=>x.at<=this.index);
  if(due>=0) return {...this.revisit.splice(due,1)[0].q,review:true};
  if(this.settings.subject==='math') { let q; for(let i=0;i<10;i++){q=mathQuestion(this.settings,this.rng);if(q.text!==this.last)break;} this.last=q.text; return q; }
  if(!this.queue.length) this.queue=shuffle(CHINESE[`${this.settings.grade}-${this.settings.semester}`].filter(r=>r[0]==={easy:0,normal:1,nightmare:2}[this.settings.difficulty]),this.rng);
  if(this.queue.length>1 && this.queue[0][2]===this.last) [this.queue[0],this.queue[1]]=[this.queue[1],this.queue[0]];
  const [,topic,text,answer,distractors,explanation]=this.queue.shift();this.last=text;
  return {topic,text,answer,options:shuffle([answer,...distractors.split('|')],this.rng),explanation};
 }
 retry(q) { if(!this.revisit.some(x=>x.q.text===q.text)) this.revisit.push({q:{...q,review:false},at:this.index+3}); }
}
