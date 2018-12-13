//전역변수 (대기, 방향, 목적지, 문, 콜배열)
let ev_standby = true;
let ev_direction ='up';
let ev_destination ='foo';
let ev_door = false;
let ev_callarray = new Array(0);

//이벤트 리스너 걸기
$(document).ready(function(){
  //각 층 div 안의 input button
  let all_floor = document.querySelectorAll('.floorBtn');
  for (let i=0; i<all_floor.length; i++){
    all_floor[i].addEventListener('click', pushTheButtons);
  }
});


//<1> 버튼 콜 시스템(엘리베이터 콜/ 최초 동작 신호 줌 startEv())
function pushTheButtons(){

  //1. 버튼 누른 층 콜 값을 받음
  let call_floor = parseInt(this.value);
  let message = 'on';
  adjustFloorBtn(call_floor, message);

  //2. 현재 층(엘베 있는 층) 위치 정보 값을 가져옴
  let ev = document.querySelector('#ev');
  let evTop = parseInt(getStyle(ev, 'top', 'top'));

  let findFloor = (660-evTop) / 110;
  let ev_floor = Math.floor(findFloor)

  //3.엘베가 대기중인가?
  if(ev_standby==true){
    //3-1. Yes: 콜층 목적지/ 방향 정해줌. false로 엘베 시스템 켜줌
    startEv(call_floor, ev_floor);
  } else {
    //+중복 콜 확인
    if(ev_callarray.indexOf(call_floor)==-1){
      // 제이쿼리 간단화 (3-2 adjustEv 콜정렬 알고리즘 삭제)
      ev_callarray.push(call_floor);
    }
  }
} //pushTheButtons() 끝


//3-1 대기중인 엘베 가동 메소드
function startEv(call_floor, ev_floor){
  console.log("startEv()");
  //1. 방향 정하기 : 현재 층과 콜 값을 비교함
  let gap = ev_floor - call_floor;

    //현재 층보다 콜 값이 높나? yes-> direction=up // no ->down
    if(gap < 0) { //콜 값이 높음
      ev_direction="up";

    } else if (gap > 0) { // 콜 값이 낮음
      ev_direction="down";

    } else { //undefined 등
      console.log("startEv() gap: "+ gap);
      console.log("floorCall gap 값 확인");
    }

    //2. 목적지 설정
    ev_destination=call_floor;
    ev_callarray[0]=call_floor;

    //3. 엘리베이터 대기상태 off
    if(ev_callarray[0]=ev_destination){ //초반 예외 오류 검사
      ev_standby=false;
      // moveEle 호출
      console.log("startEv()->moveEle call_floor:" +call_floor);

      //jQuery에서는 모두 moveEle()로 간다.
      moveEle();
  }
} //startEv()끝


//<2> 엘리베이터 조정 Flow 시스템
//각 층 가는 move
//top:110 x (5 - 해당층)px
function moveEle(){
  console.log("moveEle() direction: "+ev_direction);
  console.log("moveEle() callarray: "+ev_callarray);
  console.log("ev_destination: "+ev_destination);

  if(ev_standby==true){
    //대기 중일 땐 움직이지 않는다.

  } else {
    if(ev_callarray.length==0){
      ev_standby=true;
      turnOffEle();

    } else {
      //안전장치(ev_destination==undefined)
      if(ev_destination=="undefined" && ev_direction=="up"){
        ev_destination = Math.max.apply(null, ev_callarray);
      } else if(ev_destination=="undefined" && ev_direction=="down"){
        ev_destination = Math.min.apply(null, ev_callarray);
      }
        //여기 좀 불안함.
        turnOnEle();
        let tmp = ev_callarray[0];
        $("#ev").animate({"top":540-((tmp-1)*110)+"px"}, 1000);
        let key= setTimeout("openDoor("+tmp+")", 1500);

    }
  }
}

function openDoor(tmp){
  let all_floor = document.querySelectorAll("img");
  $(all_floor).eq(5-tmp).attr("src","img/on.png");
  let key = setTimeout("closeDoor("+tmp+")", 500);
}


function closeDoor(tmp){
  let all_floor = document.querySelectorAll("img");
  adjustFloorBtn(tmp, "off");
  $(all_floor).eq(5-tmp).attr("src","img/off.png");
  //스택에서 콜 제거
  ev_callarray.shift();
  let key= setTimeout("orderSequence("+tmp+")", 100);

}


function orderSequence(tmp){
  console.log("OS tmp: "+tmp);
  console.log("os desL "+ ev_destination);
  console.log("OS ev_callarray.length: "+ev_callarray.length);

  //경로 보정1: 방향 설정

  //문제 알아냄 ==> 이거 callarray [0]이 목적지 도착일때가 아니라 그 직전부터 쭈욱 이어짐  어레이가 나가기 전에 추가되버리면! 방향이 바뀌어 버리고 어레이가 엉킴
  //tmp로 받았으나..
  if(tmp==ev_destination && ev_callarray.length>0){
    ev_direction=='up'? ev_direction='down' : ev_direction='up';
  }

  //하 하드코딩 회문식 실패
  // if(tmp==1){
  //   ev_direction="up";
  // } else if (tmp==5){
  //   ev_direction="down";
  // } else if (tmp==4) {
  //   (ev_callarray.indexOf(5)==-1)?(ev_direction="down"):(ev_direction="up")
  // } else if (tmp==3) {
  //   (ev_callarray.indexOf(5)==-1 && ev_callarray.indexOf(4)==-1 )?(ev_direction="down"):(ev_direction="up")
  // } else if (tmp==2) {
  //   (ev_callarray.indexOf(1)==-1)?(ev_direction="up"):(ev_direction="down")
  // }



  //경로 보정2: 방향에 따라 경유지/목적지/후순위 콜 배열 지정
  if(ev_direction=='up'){
    let arr=ev_callarray.filter(function(n){
      return n >= tmp;
    });
    let arr2=ev_callarray.filter(function(n){
      return n < tmp;
    });

    arr.sort(function(a, b){return a-b});
    arr2.sort(function(a, b){return b-a});
    ev_callarray=arr.concat(arr2);
    ev_destination = Math.max.apply(null, ev_callarray); //남은 배열 중 제일 큰 숫자  = 목적지


    console.log("closeDoor up: "+ev_callarray);
    console.log("ev_destination: "+ev_destination);

  } else { //ev_direction=='down'
    let arr=ev_callarray.filter(function(n){
      return n <= tmp;
    });
    let arr2=ev_callarray.filter(function(n){
      return n > tmp;
    });
    arr.sort(function(a, b){return b-a});
    arr2.sort(function(a, b){return a-b});
    ev_callarray=arr.concat(arr2);
    ev_destination = Math.min.apply(null, ev_callarray); //남은 배열 중 제일 작은 숫자 = 목적지

    console.log("closeDoor down: "+ev_callarray);
    console.log("ev_destination: "+ev_destination);
  }

  moveEle();
}



//엘리베이터 작동/미작동 색상 변경
function turnOnEle(){
  $("#ev").css({"background-color":"pink", "color":"white"})
}
function turnOffEle(){
  $("#ev").css({"background-color":"", "color":""})
}

//버튼 색 변경 관련 메소드
function adjustFloorBtn(floor, message){
  if (message=="on"){ //버튼 누름
    let btn = $("#"+floor+"f");
    $(btn).css("background-color","red");
    $(btn).css("disabled","disabled");

  } else if (message="off") {
    let btn = $("#"+floor+"f");
    $(btn).css("background-color","");
    $(btn).css("disabled","");
  }

}

//스타일 속성 가져오기
function getStyle(elem, cssprop, cssprop2){
   //IE
   if(elem.currentStyle){
       return elem.currentStyle[cssprop];
   //다른 브라우저
   } else if(document.defaultView && document.defaultView.getComputedStyle) {
       return document.defaultView.getComputedStyle(elem, null).getPropertyValue(cssprop2);
   //대비책
   } else {
       return null;
   }
 }
