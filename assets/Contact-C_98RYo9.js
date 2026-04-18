import{A as e,G as t,H as n,k as r}from"./proxy-Blo90diG.js";import{i,n as a,o,s,t as c}from"./gameui-C8jTK-N_.js";import{t as l}from"./github-DtCUGthz.js";import{t as u}from"./SEO-CvgwDRGq.js";var d=r(`Globe`,[[`circle`,{cx:`12`,cy:`12`,r:`10`,key:`1mglay`}],[`path`,{d:`M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20`,key:`13o1zl`}],[`path`,{d:`M2 12h20`,key:`9i4pu4`}]]),f=r(`Lock`,[[`rect`,{width:`18`,height:`11`,x:`3`,y:`11`,rx:`2`,ry:`2`,key:`1w4ew1`}],[`path`,{d:`M7 11V7a5 5 0 0 1 10 0v4`,key:`fwvmzm`}]]),p=r(`Zap`,[[`path`,{d:`M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z`,key:`1xq2db`}]]),m=t(n(),1),h=Date.now(),g=[],_={help:{desc:`Show available commands`,exec:()=>`AVAILABLE COMMANDS:
  help       - Show this message
  github     - Open GitHub profile
  linkedin   - Open LinkedIn profile
  whoami     - About Saku
  ls         - List contact methods
  date       - Current date/time
  neofetch   - System info
  matrix     - Enter the matrix
  clear      - Clear terminal

SYSTEM / LORE:
  uptime     - Time since page loaded
  ping       - Fake latency readout
  uname      - Short system info
  ps         - Fake process list
  top        - Process list with CPU/mem
  ifconfig   - Fake network output

PROJECTS / WORK:
  projects   - List actual projects
  cat        - View README.md
  git log    - Fake commit history
  man saku   - Manual page bio

UTILITY:
  echo       - Echo text
  history    - Command history
  man        - Manual for commands
  alias      - List aliases`},github:{desc:`Open GitHub profile`,exec:()=>(window.open(`https://github.com/Arknight38`,`_blank`),`OPENING GITHUB...`)},linkedin:{desc:`Open LinkedIn profile`,exec:()=>(window.open(`https://linkedin.com/in/saku-grossarth-9040083aa`,`_blank`),`OPENING LINKEDIN...`)},whoami:{desc:`About Saku`,exec:()=>`SAKU@PORTFOLIO
---------------
NAME: Saku Grossarth
ROLE: Low-level Systems & Security Researcher
FOCUS: Kernel development, reverse engineering, vuln research
LOCATION: Colorado Springs, CO
STATUS: ● Open to opportunities`},ls:{desc:`List contact methods`,exec:()=>`CONTACT/
├── github   → @Arknight38
└── linkedin → Saku Grossarth`},date:{desc:`Current date/time`,exec:()=>new Date().toString().toUpperCase()},neofetch:{desc:`System info`,exec:()=>`    ___       ___       ___       ___
   /\\__\\     /\\  \\     /\\__\\     /\\  \\
  /:/  /    /::\\  \\   /:/  /    /::\\  \\
 /:/__/    /:/\\:\\__\\ /:/__/    /:/\\:\\__\\
 \\:\\  \\    /:/ /:/  /|:|  |__ /:/ /:/  /
  \\:\\  \\  /:/_/:/  / |:| /\\  /:/_/:/  /
   \\:\\__\\ \\:\\/:/  /  |:|/__/ \\:\\/:/  /
    \\/__/  \\::/  /   |:|\\_|/   \\::/  /
           /:/  /    |:| \\|/   /:/  /
          /:/  /      \\|/|/    /:/  /
          \\/__/        /__/     \\/__/

SAKU@PORTFOLIO
----------------
OS: Portfolio OS 1.0
HOST: Arknight38.github.io
KERNEL: low-level-security
SHELL: contact-terminal
LANGS: C, C++, Rust, Python
FOCUS: Systems, Security, RE`},matrix:{desc:`Enter the matrix`,exec:()=>{let e=`01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン`,t=``;for(let n=0;n<12;n++){let n=``;for(let t=0;t<40;t++)n+=e[Math.floor(Math.random()*48)];t+=n+`
`}return{content:t+`
WAKE UP, NEO...`,animated:!0,chars:e,lines:12,cols:40}}},clear:{desc:`Clear terminal`,exec:e=>(e([]),null)},secret:{desc:`Hidden`,exec:()=>`ACCESS GRANTED: RESTRICTED SECTOR

[REDACTED] Intel discovered via unconventional analysis.

"Understanding a system requires observing it from angles
not documented in the specification."

Trace origin: Reverse engineering discipline
Competency: Systems-level debugging
Status: Operational`},uptime:{desc:`Time since page loaded`,exec:()=>{let e=Date.now()-h,t=Math.floor(e/1e3);return`UPTIME: ${Math.floor(t/60)}m ${t%60}s`}},ping:{desc:`Fake latency readout`,exec:()=>`PINGING sakugrossarth.dev...\n64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=${Math.floor(Math.random()*20)+2}ms`},uname:{desc:`Short system info`,exec:()=>`PortfolioOS 1.0 x86_64 GNU/Linux`},ps:{desc:`Fake process list`,exec:()=>`  PID TTY          TIME CMD
    1 pts/0    00:00:42 kernel-driver-research
    2 pts/0    00:01:15 vuln-scanner
    3 pts/0    00:00:08 coffee-daemon
    4 pts/0    00:00:23 reverse-engineering
    5 pts/0    00:00:31 rust-compiler`},top:{desc:`Process list with CPU/mem`,exec:()=>`top - 12:34:56 up 1 day,  2 users,  load average: 0.42, 0.31, 0.28
Tasks:   5 total,   2 running,   3 sleeping,   0 stopped,   0 zombie
%Cpu(s): 12.3 us,  5.2 sy,  0.0 ni, 80.5 id,  2.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem:   16384.0 total,   8192.0 free,   4096.0 used,   4096.0 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 saku      20   0   12345   2048    512 R  15.2   0.1   0:42.31 kernel-driver-research
    2 saku      20   0   23456   4096   1024 S   8.5   0.2   1:15.42 vuln-scanner
    3 saku      20   0    3456    512    256 S   2.1   0.0   0:08.15 coffee-daemon
    4 saku      20   0   45678   8192   2048 R  12.3   0.4   0:23.67 reverse-engineering
    5 saku      20   0   56789   6144   1536 S  18.7   0.3   0:31.89 rust-compiler`},ifconfig:{desc:`Fake network output`,exec:()=>`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.38  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>
        ether 00:11:22:33:44:55  txqueuelen 1000  (Ethernet)
        RX packets 12345  bytes 1234567 (1.2 MiB)
        TX packets 67890  bytes 9876543 (9.4 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 42  bytes 2048 (2.0 KiB)
        TX packets 42  bytes 2048 (2.0 KiB)

GITHUB_LINK: 192.168.1.100
LINKEDIN_LINK: 192.168.1.101`},projects:{desc:`List actual projects`,exec:()=>i.map(e=>`● ${e.name}
  ${e.description.substring(0,80)}...`).join(`

`)},cat:{desc:`View README.md`,exec:()=>`# Saku Grossarth

Low-level systems & security researcher focused on kernel development,
reverse engineering, and vulnerability research.

## Focus Areas
- Kernel-mode driver development
- Binary analysis and reverse engineering
- Hypervisor research (VT-x/VMX)
- Security tooling and exploit development

## Tech Stack
- C, C++, Rust, Python
- Windows internals, Linux kernel
- Ghidra, IDA Pro, WinDbg

## Contact
- GitHub: @Arknight38
- LinkedIn: Saku Grossarth

---
"Understanding a system requires observing it from angles
not documented in the specification."`},"git log":{desc:`Fake commit history`,exec:()=>`commit a1b2c3d4e5f67890 (HEAD -> main)
Author: Saku
Date:   ${new Date().toDateString()}

    feat: added hypervisor stealth module

commit b2c3d4e5f67890a1
Author: Saku
Date:   ${new Date(Date.now()-864e5).toDateString()}

    fix: stopped being bad at Rust

commit c3d4e5f67890a1b2
Author: Saku
Date:   ${new Date(Date.now()-1728e5).toDateString()}

    refactor: rewrote memory scanner in C++

commit d4e5f67890a1b2c3
Author: Saku
Date:   ${new Date(Date.now()-2592e5).toDateString()}

    docs: added kernel debugging guide

commit e5f67890a1b2c3d4
Author: Saku
Date:   ${new Date(Date.now()-3456e5).toDateString()}

    feat: implemented EPT memory virtualization`},"man saku":{desc:`Manual page bio`,exec:()=>`SAKU(1)                     User Commands                    SAKU(1)

NAME
     saku - Low-level Systems & Security Researcher

SYNOPSIS
     saku [--kernel] [--reverse-engineering] [--vuln-research]

DESCRIPTION
     Saku Grossarth is a systems and security researcher focused on
     kernel development, reverse engineering, and vulnerability research.

OPTIONS
     --kernel
              Focus on kernel-mode driver development and hypervisor research

     --reverse-engineering
              Binary analysis using Ghidra, IDA Pro, and custom tools

     --vuln-research
              Security research and exploit development

EXAMPLES
     saku --kernel --hypervisor
              Build and test hypervisor with VMX/EPT support

     saku --reverse-engineering target.exe
              Analyze binary and generate AOB signatures

SEE ALSO
     whoami(1), neofetch(1), projects(1)

AUTHOR
     Saku Grossarth

PORTFOLIO OS                          April 2026                       SAKU(1)`},sudo:{desc:`Try to get root`,exec:()=>`Nice try. You don't have root here.`},"rm -rf /":{desc:`Try to delete everything`,exec:()=>`⚠️  WARNING: DELETING ROOT FILESYSTEM...
rm: cannot remove '/': Device or resource busy
rm: it's probably for the best
rm: just kidding. nice try though.`},hack:{desc:`Fake intrusion attempt`,exec:()=>[`INITIATING INTRUSION SEQUENCE...`,`BYPASSING FIREWALL...`,`DECRYPTING PASSWORDS...`,`ACCESSING MAINFRAME...`,`UPLOADING PAYLOAD...`,`████████████████████ 100%`,`ACCESS DENIED: you're not that guy`].join(`
`)},vim:{desc:`Enter vim (good luck)`,exec:()=>`entering vim... good luck getting out...
[after 5 minutes of trying]
hint: try :q`},coffee:{desc:`ASCII art coffee`,exec:()=>`    (
    )\\
  .--' '--.
 /          \\
|            |
 \\,        ,/
  '--------,'
BREWING... DONE.
PRODUCTIVITY +12%`},fortune:{desc:`Random hacker quote`,exec:()=>{let e=[`"Talk is cheap. Show me the code." - Linus Torvalds`,`"First, solve the problem. Then, write the code." - John Johnson`,`"The best error message is the one that never shows up." - Thomas Fuchs`,`"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler`,`"Debugging is twice as hard as writing the code in the first place." - Brian Kernighan`,`"There are only two kinds of languages: the ones people complain about and the ones nobody uses." - Bjarne Stroustrup`,`"If you think your users are idiots, only idiots will use your software." - Linus Torvalds`,`"The computer was born to solve problems that did not exist before." - Bill Gates`,`"Most software today is very much like an Egyptian pyramid with millions of bricks piled on top of each other, with no structural integrity." - Alan Kay`,`"There is no such thing as a secure system." - Bruce Schneier`];return e[Math.floor(Math.random()*e.length)]}},echo:{desc:`Echo text`,exec:(e,t)=>t.join(` `)||``},history:{desc:`Command history`,exec:()=>g.length===0?`No commands in history.`:g.map((e,t)=>`  ${t+1}  ${e}`).join(`
`)},man:{desc:`Manual for commands`,exec:(e,t)=>{let n=t[0];if(!n)return`What manual page do you want?`;if(n===`saku`)return _[`man saku`].exec();let r=_[n];return r?`${n}(1)                    User Commands                   ${n.toUpperCase()}(1)

NAME
     ${n} - ${r.desc}

DESCRIPTION
     ${r.desc}

SEE ALSO
     help(1)`:`No manual entry for ${n}`}},alias:{desc:`List aliases`,exec:()=>`alias hack='read docs carefully'
alias rm='rm -i'
alias sudo='please'
alias coffee='brew --productivity-boost'
alias vim='nano --easier-mode'
alias git='git --force'`}},v=e=>{g.push(e),g.length>50&&g.shift()},y=e(),b=[{id:`github`,label:`GITHUB`,value:`Arknight38`,href:`https://github.com/Arknight38`,icon:l,description:`Source code repository`,color:`lavender`},{id:`linkedin`,label:`LINKEDIN`,value:`Saku Grossarth`,href:`https://www.linkedin.com/in/saku-grossarth-9040083aa/`,icon:d,description:`Professional network`,color:`sage`}];function x(){return(0,m.useEffect)(()=>{document.title=`SYS.ARKNIGHT // CONTACT`},[]),(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(u,{title:`Contact`,description:`Establish connection — available for systems engineering opportunities`,pathname:`/contact`}),(0,y.jsx)(c,{left:(0,y.jsx)(S,{}),center:(0,y.jsx)(C,{}),right:(0,y.jsx)(w,{})})]})}var S=(0,m.memo)(function(){return(0,y.jsxs)(`div`,{className:`zone-content`,children:[(0,y.jsxs)(a,{variant:`mid`,children:[(0,y.jsxs)(`div`,{className:`panel-header`,children:[(0,y.jsx)(s,{size:14}),(0,y.jsx)(`span`,{className:`panel-label`,children:`COMMS STATUS`})]}),(0,y.jsxs)(`div`,{className:`comms-status`,children:[(0,y.jsxs)(`div`,{className:`status-row`,children:[(0,y.jsx)(`span`,{className:`status-indicator online`}),(0,y.jsx)(`span`,{className:`status-text`,children:`ONLINE`})]}),(0,y.jsxs)(`div`,{className:`status-detail`,children:[(0,y.jsx)(`span`,{children:`COLORADO SPRINGS, CO`}),(0,y.jsx)(`span`,{children:`UTC-07:00`})]})]})]}),(0,y.jsxs)(a,{variant:`mid`,children:[(0,y.jsxs)(`div`,{className:`panel-header`,children:[(0,y.jsx)(p,{size:14}),(0,y.jsx)(`span`,{className:`panel-label`,children:`AVAILABILITY`})]}),(0,y.jsxs)(`div`,{className:`availability-info`,children:[(0,y.jsx)(`p`,{className:`availability-primary`,children:`OPEN TO OPPORTUNITIES`}),(0,y.jsx)(`p`,{className:`availability-secondary`,children:`Systems programming, security research, low-level development`})]})]}),(0,y.jsx)(a,{variant:`background`,children:(0,y.jsxs)(`div`,{className:`response-time`,children:[(0,y.jsx)(`span`,{className:`response-label`,children:`TYPICAL RESPONSE`}),(0,y.jsx)(`span`,{className:`response-value`,children:`< 24 HOURS`})]})})]})}),C=(0,m.memo)(function(){let[e,t]=(0,m.useState)([]),[n,r]=(0,m.useState)(``),i=(0,m.useRef)(null),s=(0,m.useRef)(null);(0,m.useRef)(null);let c=(0,m.useRef)(null),l=e=>{let n=e.trim();if(!n)return;v(n);let i={type:`input`,content:e},a=null,o=n.toLowerCase().split(/\s+/),s=o[0],l=o.slice(1),u=s,d=o.join(` `);if(_[d]?u=d:_[s]&&(u=s),_[u]){let e=_[u],n;n=u===`clear`?e.exec(t):u===`echo`||u===`man`?e.exec(null,l):u===`cat`?l[0]===`readme.md`||l[0]===`readme`?e.exec():`cat: ${l[0]||``}: No such file or directory`:e.exec(),n&&(n.animated?(a={type:`output`,content:n.content,animated:!0,chars:n.chars,lines:n.lines,cols:n.cols},c.current&&clearInterval(c.current),c.current=setInterval(()=>{t(e=>{let t=[...e],n=t[t.length-1];if(n&&n.animated){let e=n.content.split(`
`).slice(0,n.lines);for(let t=0;t<e.length;t++){let r=e[t],i=``;for(let e=0;e<r.length;e++)Math.random()<.15?i+=n.chars[Math.floor(Math.random()*n.chars.length)]:i+=r[e];e[t]=i}t[t.length-1]={...n,content:e.join(`
`)+`
WAKE UP, NEO...`}}return t})},100),setTimeout(()=>{c.current&&=(clearInterval(c.current),null)},5e3)):a={type:`output`,content:n})}else a={type:`error`,content:`COMMAND NOT FOUND: ${n}\nTYPE 'help' FOR AVAILABLE COMMANDS`};t(e=>[...e,i,...a?[a]:[]]),r(``)};return(0,m.useEffect)(()=>{i.current&&i.current.focus()},[]),(0,m.useEffect)(()=>{s.current?.scrollIntoView({behavior:`smooth`})},[e]),(0,y.jsxs)(a,{variant:`focal`,className:`terminal-focal`,children:[(0,y.jsxs)(`div`,{className:`terminal-header`,children:[(0,y.jsx)(o,{size:18}),(0,y.jsx)(`span`,{className:`terminal-title`,children:`CONNECTION_TERMINAL`}),(0,y.jsxs)(`div`,{className:`terminal-status-strip`,"aria-hidden":`true`,children:[(0,y.jsx)(`span`,{children:`SECURE`}),(0,y.jsx)(`strong`,{children:`OK`})]}),(0,y.jsxs)(`div`,{className:`terminal-controls`,children:[(0,y.jsx)(`span`,{className:`terminal-dot`}),(0,y.jsx)(`span`,{className:`terminal-dot`}),(0,y.jsx)(`span`,{className:`terminal-dot`})]})]}),(0,y.jsxs)(`div`,{className:`terminal-interactive-screen`,onClick:()=>i.current?.focus(),children:[(0,y.jsxs)(`div`,{className:`terminal-line`,children:[(0,y.jsx)(`span`,{className:`terminal-prefix`,children:`>`}),(0,y.jsx)(`span`,{className:`terminal-text`,children:`INITIATING_CONTACT_PROTOCOL...`})]}),(0,y.jsxs)(`div`,{className:`terminal-line`,children:[(0,y.jsx)(`span`,{className:`terminal-prefix`,children:`>`}),(0,y.jsx)(`span`,{className:`terminal-text`,children:`ESTABLISHING_SECURE_CHANNEL...`})]}),(0,y.jsxs)(`div`,{className:`terminal-line`,children:[(0,y.jsx)(`span`,{className:`terminal-prefix ready`,children:`$`}),(0,y.jsx)(`span`,{className:`terminal-text`,children:`CONNECTION_READY`})]}),(0,y.jsxs)(`div`,{className:`terminal-line welcome-line`,children:[(0,y.jsx)(`span`,{className:`terminal-prefix`,children:`$`}),(0,y.jsx)(`span`,{className:`terminal-text terminal-dim`,children:`TYPE 'help' FOR AVAILABLE COMMANDS`})]}),e.map((e,t)=>(0,y.jsx)(`div`,{className:`terminal-line`,children:e.type===`input`?(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(`span`,{className:`terminal-prefix ready`,children:`$`}),(0,y.jsx)(`span`,{className:`terminal-text`,children:e.content})]}):e.type===`error`?(0,y.jsx)(`span`,{className:`terminal-output terminal-error`,children:e.content}):(0,y.jsx)(`span`,{className:`terminal-output`,children:e.content})},t)),(0,y.jsxs)(`div`,{className:`terminal-input-wrapper`,children:[(0,y.jsx)(`span`,{className:`terminal-prefix ready`,children:`$`}),(0,y.jsx)(`input`,{ref:i,type:`text`,className:`terminal-command-input`,value:n,onChange:e=>r(e.target.value),onKeyDown:e=>{e.key===`Enter`&&l(n)},placeholder:`ENTER_COMMAND...`,spellCheck:!1,autoComplete:`off`})]}),(0,y.jsx)(`div`,{ref:s})]}),(0,y.jsx)(`div`,{className:`terminal-divider`})]})}),w=(0,m.memo)(function(){return(0,y.jsxs)(`div`,{className:`zone-content`,children:[(0,y.jsxs)(a,{variant:`mid`,children:[(0,y.jsx)(`div`,{className:`panel-header`,children:(0,y.jsx)(`span`,{className:`panel-label`,children:`PRIORITY CHANNELS`})}),(0,y.jsx)(`div`,{className:`priority-list`,children:b.map(e=>{let t=e.icon;return(0,y.jsx)(`a`,{href:e.href,target:e.href.startsWith(`http`)?`_blank`:void 0,rel:e.href.startsWith(`http`)?`noopener`:void 0,className:`priority-link`,children:(0,y.jsxs)(`div`,{className:`priority-item`,children:[(0,y.jsx)(`span`,{className:`priority-rank`,children:String(b.indexOf(e)+1).padStart(2,`0`)}),(0,y.jsx)(`span`,{className:`priority-name`,children:e.label}),(0,y.jsx)(t,{size:14,className:`priority-icon ${e.color}`}),(0,y.jsx)(`span`,{className:`priority-desc`,children:e.description})]})},e.id)})})]}),(0,y.jsx)(a,{variant:`background`,children:(0,y.jsxs)(`div`,{className:`encrypted-notice`,children:[(0,y.jsx)(f,{size:14,className:`notice-icon`}),(0,y.jsx)(`span`,{className:`notice-text`,children:`All communications are treated confidentially`})]})})]})});export{x as Contact};