/*

 @name    : 锅巴汉化 - Web汉化插件
 @author  : 麦子、JAR、小蓝、好阳光的小锅巴
 @version : V0.6.1 - 2019-07-09
 @website : http://www.g8hh.com

*/

//1.汉化杂项
var cnItems = {
    _OTHER_: [],

    //工具页面：
    '← Game': '← 游戏',
    'FAQ': '常见问题',
    'Changelog': '更新日志',
    'Fix': '修复',
    'Load save': '加载存档',
    'Input': '输入',
    'Output': '输出',
    'Tools': '工具',
    'Back to top': '回到顶部',
    'What is this page?': '这是什么页面？',
    'This page contains some tools and cheats for players who have been affected by bugs and balancing issues in the game. The cheats here are quite specific, so unless you\'ve been directed here to fix a specific issue, they will likely not be useful to you.': '此页面包含一些工具和作弊技巧，供受到游戏错误和平衡问题影响的玩家使用。 这里的作弊是非常具体的，因此，除非您被指示在此处解决特定问题，否则它们可能对您没有用。',
    'PROBLEM: Stuck on level 12 with not enough evidence': '问题:在没有足够线索的情况下卡在第12层',
    'PROBLEM: Stuck on level 13 with not enough evidence': '问题:在没有足够线索的情况下卡在第13层',
    'Paste the save you want to fix to the "Input" box. You can export your save from the game via the import/export popup in the footer. Once a fix has been applied, the fixed save will appear in the "Output" box. You can then import it to the game using the same popup.': '将您想要修复的保存粘贴到“输入”框。你可以通过页脚的导入/导出弹出窗口从游戏中导出保存。一旦应用了修复，修复后的保存将出现在“输出”框中。然后你可以使用相同的弹出框将其导入游戏。',
    'Level 13 Tools': '13层工具',
    'If you unlocked Building Projects before Crafting, you might have gotten stuck without enough evidence for Crafting and no more sectors you can scout due to them being too cold. This tool will remove the Building Projects upgrade and reinburse the amount of Evidence you spent on it, allowing you to get Crafting first and continue.': '如果你在锻造前解锁建筑项目，你可能会因为没有足够的锻造线索而卡住，也没有更多的区域你可以侦查，因为它们太冷了。这个工具将移除建筑项目的升级，并重新补偿你在上面花费的线索，让你能够首先获得锻造并继续。',
    'If you played version 0.3.1 and bought all other available upgrades before Compass, you might have gotten stuck without enough evidence to buy Compass. This tool will remove the Knife upgrade from you and reinburse the amount of Evidence you spent on it, allowing you to continue.': '如果你玩过0.3.1版本并在指南针之前购买了所有其他可用的升级，你可能会因为没有足够的线索而无法购买指南针。这个工具将删除你的刀升级，并重新补偿你在它上花费的线索，让你继续。',
    // FAQ
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    '': '',
    // 更新日志
    '': '',
    '': '',
    '': '',
    '': '',

    //原样
    '': '',
    '': '',

}


//需处理的前缀
var cnPrefix = {
    "(-": "(-",
    "(+": "(+",
    "(": "(",
    "-": "-",
    "+": "+",
    " ": " ",
    ": ": "： ",
    "\n": "",
    "                   ": "",
    "                  ": "",
    "                 ": "",
    "                ": "",
    "               ": "",
    "              ": "",
    "             ": "",
    "            ": "",
    "           ": "",
    "          ": "",
    "         ": "",
    "        ": "",
    "       ": "",
    "      ": "",
    "     ": "",
    "    ": "",
    "   ": "",
    "  ": "",
    " ": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
}

//需处理的后缀
var cnPostfix = {
    ":": "：",
    "：": "：",
    ": ": "： ",
    "： ": "： ",
    " ": "",
    "/s)": "/s)",
    "/s": "/s",
    ")": ")",
    "%": "%",
    "                   ": "",
    "                  ": "",
    "                 ": "",
    "                ": "",
    "               ": "",
    "              ": "",
    "             ": "",
    "            ": "",
    "           ": "",
    "          ": "",
    "         ": "",
    "        ": "",
    "       ": "",
    "      ": "",
    "     ": "",
    "    ": "",
    "   ": "",
    "  ": "",
    " ": "",
    "\n": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
}

//需排除的，正则匹配
var cnExcludeWhole = [
    /^x?\d+(\.\d+)?[A-Za-z%]{0,2}(\s.C)?\s*$/, //12.34K,23.4 °C
    /^x?\d+(\.\d+)?(e[+\-]?\d+)?\s*$/, //12.34e+4
    /^\s*$/, //纯空格
    /^\d+(\.\d+)?[A-Za-z]{0,2}.?\(?([+\-]?(\d+(\.\d+)?[A-Za-z]{0,2})?)?$/, //12.34M (+34.34K
    /^(\d+(\.\d+)?[A-Za-z]{0,2}\/s)?.?\(?([+\-]?\d+(\.\d+)?[A-Za-z]{0,2})?\/s\stot$/, //2.74M/s (112.4K/s tot
    /^\d+(\.\d+)?(e[+\-]?\d+)?.?\(?([+\-]?(\d+(\.\d+)?(e[+\-]?\d+)?)?)?$/, //2.177e+6 (+4.01+4
    /^(\d+(\.\d+)?(e[+\-]?\d+)?\/s)?.?\(?([+\-]?(\d+(\.\d+)?(e[+\-]?\d+)?)?)?\/s\stot$/, //2.177e+6/s (+4.01+4/s tot
];
var cnExcludePostfix = [
    /:?\s*x?\d+(\.\d+)?(e[+\-]?\d+)?\s*$/, //12.34e+4
    /:?\s*x?\d+(\.\d+)?[A-Za-z]{0,2}$/, //: 12.34K, x1.5
]

//正则替换，带数字的固定格式句子
//纯数字：(\d+)
//逗号：([\d\.,]+)
//小数点：([\d\.]+)
//原样输出的字段：(.+)
var cnRegReplace = new Map([
    [/^requires ([\d\.]+) more research points$/, '需要$1个研究点'],
    [/^(\d+) Royal points$/, '$1 皇家点数'],
    [/^Cost: (\d+) RP$/, '成本：$1 皇家点数'],
    [/^Usages: (\d+)\/$/, '用途：$1\/'],
    [/^workers: (\d+)\/$/, '工人：$1\/'],

]);