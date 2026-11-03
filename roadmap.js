/* Draws the progress bar and the timeline from the data in _data/roadmap.yml.
   You don't need to edit this file to update content. */
(function(){
  var DATA=JSON.parse(document.getElementById("roadmap-data").textContent);
  var PLAN=DATA.plan;
  var ENTRIES=DATA.entries||[];

  var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var TYPE={decision:"Decision",deliverable:"Deliverable",learning:"Learning",teardown:"Teardown",impact:"Impact",feedback:"Feedback",badge:"Badge"};
  var PILL={ai:"AI",pm:"Product",base:"Background"};
  var STAT={done:"Done",doing:"In progress",planned:"Planned"};

  function parse(s){var a=String(s).split("-");return new Date(+a[0],+a[1]-1,+a[2]);}
  function pad(n){return (n<10?"0":"")+n;}
  function iso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
  function fmt(d){return d.getDate()+" "+MON[d.getMonth()]+" "+d.getFullYear();}
  function fmtM(d){return MON[d.getMonth()]+" "+d.getFullYear();}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function col(p){return p==="ai"?"var(--ai)":p==="pm"?"var(--pm)":"var(--base)";}
  function colors(e){return "--c1:"+col(e.pillars[0])+";--c2:"+col(e.pillars[1]||e.pillars[0]);}

  var DAY=864e5;
  var today=new Date();today.setHours(0,0,0,0);
  var start=parse(PLAN.start),end=parse(PLAN.end);
  var total=Math.round((end-start)/DAY);
  var elapsed=Math.round((today-start)/DAY);
  var pct=Math.max(0,Math.min(1,elapsed/total))*100;
  var dayN=Math.max(1,Math.min(total,elapsed+1));

  document.getElementById("tb-plan").textContent=fmtM(start)+" to "+fmtM(end);

  ENTRIES.forEach(function(e){e.pillars=e.pillars||["base"];if(e.date)e.date=String(e.date);});
  var earlier=ENTRIES.filter(function(e){return e.earlier;});
  var plan=ENTRIES.filter(function(e){return !e.earlier;}).map(function(e,i){e._i=i;return e;}).sort(function(a,b){
    return a.date<b.date?-1:a.date>b.date?1:a._i-b._i;
  });

  /* Ruler */
  var r='<div class="track"><i class="fill" style="width:'+pct.toFixed(2)+'%"></i></div>';
  var d=new Date(start.getFullYear(),start.getMonth(),1);
  while(d<=end){
    var left=Math.max(0,(d-start)/(end-start)*100);
    r+='<span class="tick" style="left:'+left.toFixed(2)+'%"><span>'+MON[d.getMonth()]+'</span></span>';
    d=new Date(d.getFullYear(),d.getMonth()+1,1);
  }
  var side=pct<9?" l":pct>91?" r":"";
  r+='<span class="today'+side+'" style="left:'+pct.toFixed(2)+'%"><em>Today</em></span>';
  var ruler=document.getElementById("ruler");
  ruler.innerHTML=r;
  ruler.setAttribute("aria-label","Day "+dayN+" of "+total+" of the plan, from "+fmt(start)+" to "+fmt(end));

  /* Stats */
  var cnt={done:0,doing:0,planned:0};
  plan.forEach(function(e){cnt[e.status]++;});
  document.getElementById("stat").innerHTML=
    '<span>Day <b>'+dayN+'</b> of '+total+'</span>'+
    '<span><b>'+cnt.done+'</b> done</span>'+
    '<span><b>'+cnt.doing+'</b> in progress</span>'+
    '<span><b>'+cnt.planned+'</b> planned</span>';

  /* Pillar meters: one dot per entry */
  var mh="";
  [["ai","AI"],["pm","Product"]].forEach(function(p){
    var list=plan.filter(function(e){return e.pillars.indexOf(p[0])>-1;});
    var done=list.filter(function(e){return e.status==="done";}).length;
    mh+='<div class="m"><span class="ml">'+p[1]+'</span><span class="dots">'+
      list.map(function(e){return '<span class="dot s-'+e.status+'" style="--c1:var(--'+p[0]+');--c2:var(--'+p[0]+')" title="'+esc(e.title)+'"></span>';}).join("")+
      '</span><span class="mc">'+done+' of '+list.length+'</span></div>';
  });
  document.getElementById("meters").innerHTML=mh;

  /* Timeline rows */
  function divider(label,sub){
    return '<li class="row d div"><h2>'+esc(label)+(sub?'<small>'+esc(sub)+'</small>':'')+'</h2></li>';
  }
  function todayRow(){
    return '<li class="row d tdy"><span class="node tnode"></span><div class="body tline">Today, '+fmt(today)+'</div></li>';
  }
  function entry(e,isPlan){
    var tags='<span class="type">'+(TYPE[e.type]||esc(e.type||""))+'</span>'+e.pillars.map(function(p){return '<span class="pill '+p+'">'+PILL[p]+'</span>';}).join("");
    var h='<li class="row ev '+(e.status==="planned"?"p":"d")+'"'+(isPlan?' data-plan="1"':'')+' data-p="'+e.pillars.join(" ")+'">';
    h+='<div class="when"><span>'+esc(e.when)+'</span><span class="st">'+STAT[e.status]+'</span></div>';
    h+='<span class="dot node s-'+e.status+'" style="'+colors(e)+'"></span>';
    h+='<div class="body"><div class="tags">'+tags+'</div><h3>'+esc(e.title)+'</h3><p>'+esc(e.text)+'</p>';
    if(e.metric)h+='<p class="metric">'+esc(e.metric)+'</p>';
    if(e.link)h+='<a class="ln" href="'+esc(e.link.url)+'" target="_blank" rel="noopener">'+esc(e.link.label)+' &rarr;</a>';
    return h+'</div></li>';
  }

  var rows=[];
  if(earlier.length){
    rows.push(divider("Before the plan"));
    earlier.forEach(function(e){rows.push(entry(e,false));});
  }
  rows.push(divider("The plan",fmtM(start)+" to "+fmtM(end)));
  var ti=iso(today),marked=false;
  plan.forEach(function(e){
    if(!marked&&e.date>ti){rows.push(todayRow());marked=true;}
    rows.push(entry(e,true));
  });
  if(!marked)rows.push(todayRow());
  document.getElementById("tl").innerHTML=rows.join("");

  /* Last update = latest done entry in the plan */
  var lastDone=plan.filter(function(e){return e.status==="done";}).map(function(e){return e.date;}).sort().pop();
  var upd=lastDone?fmt(parse(lastDone)):"-";
  document.getElementById("tb-upd").textContent=upd;
  document.getElementById("upd").textContent="Last update: "+upd;

  /* Pillar filter (applies to plan entries only) */
  var chips=document.querySelectorAll(".chip");
  var countEl=document.getElementById("count");
  function apply(f){
    var shown=0,tot=0;
    document.querySelectorAll("#tl [data-plan]").forEach(function(li){
      tot++;
      var ok=f==="all"||(" "+li.getAttribute("data-p")+" ").indexOf(" "+f+" ")>-1;
      li.hidden=!ok;
      if(ok)shown++;
    });
    chips.forEach(function(c){c.setAttribute("aria-pressed",c.getAttribute("data-f")===f?"true":"false");});
    countEl.textContent=f==="all"?tot+" entries in the plan":shown+" of "+tot+" entries in the plan";
  }
  chips.forEach(function(c){c.addEventListener("click",function(){apply(c.getAttribute("data-f"));});});
  apply("all");
})();
