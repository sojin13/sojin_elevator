
//전역변수 (대기, 방향, 목적지, 문, 콜배열)
let ev_standby = true;
let ev_direction ='up';
let ev_destination ='foo';
let ev_door = false;
let ev_callarray = new Array(0);
let call_sign = new Array(0);

//이벤트 리스너 걸기
$(document).ready(function(){
  //각 층 div 안의 input button
  let all_floor = document.querySelectorAll('.floorBtn');
  for (let i=0; i<all_floor.length; i++){
    all_floor[i].addEventListener('click', pushTheButtons);
  }
});


//엘베 버튼 눌렀을 때 이벤트트리거 발동
function pushTheButtons(){

  let call_floor = parseInt(this.value);
  ev_callarray.push(call_floor)
  pushTheFloorBtn(call_floor);

  //대기 상태일때
  if(ev_standby==true) {
    ev_standby=false; //엘베 켜줌
    ev_destination=call_floor;
    orderSequence("operate");
    movementSequence();

  } else {
    //+중복 콜 확인
    if(ev_callarray.indexOf(call_floor)==-1){
      console.log("작동 중 콜 들어옴");
      orderSequence("call");
    }
  }
}

//콜 사인 - 비동기 상관없는 것들
function pushTheFloorBtn(call_floor){
  call_sign[0]=call_floor;
  call_sign[1]="on";
  changeTheFloorBtn(call_sign);

}


//[1] 콜 정렬 시퀀스
function orderSequence(message){

  console.log(message);
  if (message=="operate"){
    findADirection(message)

  } else if(message=="arrived") {
    findADirection(message)
      .then(setTheDestination())
      .then(sortTheArrayOut());

  } else if(message=="call") {
    setTheDestination()
    .then(sortTheArrayOut());
  }

}

//방향조정 (1순위)  //처음 클릭할 때, 목적지 도착했을 때 새로 설정
function findADirection(message) {
  return new Promise((resolve, reject) => {
    //엘베 켤 때
    if(message=="operate"){
      //1. 현재 층(엘베 있는 층) 위치 정보 값을 가져옴
      let ev = document.querySelector('#ev');
      let evTop = parseInt(getStyle(ev, 'top', 'top'));

      let findFloor = (660-evTop) / 110;
      let ev_floor = Math.floor(findFloor);

      //2. 방향 정하기 : 현재 층과 목적지 값 비교함
      let gap = ev_floor - ev_destination;
      //현재 층보다 콜 값이 높나? yes-> direction=up // no ->down
      if(gap < 0) { //콜 값이 높음
        ev_direction="up";

      } else if (gap > 0) { // 콜 값이 낮음
        ev_direction="down";

      } else { //undefined 등
        console.log("startEv() gap: "+ gap);
        console.log("floorCall gap 값 0");
      }

    } else if(message=="arrived") {
      ev_direction=='up'? ev_direction='down' : ev_direction='up';
    }
    resolve(ev_direction);
  });
}

//목적지 조정
function setTheDestination(){
  return new Promise((resolve, reject) => {
    if(ev_direction=="up") {
      ev_destination = Math.max.apply(null, ev_callarray);
    } else { //ev_direction=="down"
    ev_destination = Math.min.apply(null, ev_callarray);
    }
    console.log("ev_destination: "+ev_destination);
    resolve(ev_destination);
  });
}

//순서 정리
function sortTheArrayOut(){
  //경로 보정: 방향에 따라 경유지/목적지/후순위 콜 배열 지정
  return new Promise((resolve, reject) => {

    //2. 현재 층(엘베 있는 층) 위치 정보 값을 가져옴
    let ev = document.querySelector('#ev');
    let evTop = parseInt(getStyle(ev, 'top', 'top'));

    console.log("evTop: "+evTop);

    let findFloor = (650-evTop) / 110;
    let ev_floor = Math.floor(findFloor)
    console.log("findfloor: " +findFloor);
    console.log("ev_floor: " + ev_floor);
    let tmp = ev_floor


    if(ev_direction=="up"){
      let arr=ev_callarray.filter(function(n){
        return n >= tmp;
      });

      let arr2=ev_callarray.filter(function(n){
        return n < tmp;
      });

      arr.sort(function(a, b){return a-b});
      arr2.sort(function(a, b){return b-a});
      ev_callarray=arr.concat(arr2);


    } else { //ev_direction=="down"
      let arr=ev_callarray.filter(function(n){
        return n <= tmp;
      });

      let arr2=ev_callarray.filter(function(n){
        return n > tmp;
      });


      arr.sort(function(a, b){return b-a});
      arr2.sort(function(a, b){return a-b});
      ev_callarray=arr.concat(arr2);

    }
    resolve(ev_callarray);
  });
}



//[2] 엘리베이터 이동 시퀀스
function movementSequence(){
  console.log("movementSequence()");
  console.log("-ev_callarray: "+ev_callarray);
  console.log("-ev_destination: "+ev_destination);

  if(ev_standby==true){
    //대기 중일 땐 움직이지 않는다.

  } else {
    if(ev_callarray.length==0){
      ev_standby=true;
      turnOffEle();

    } else {
      turnOnEle();
      let tmp = ev_callarray[0];
      console.log("tmp: " + tmp);
      $("#ev").animate({"top":540-((tmp-1)*110)+"px"}, 1000);
      let key= setTimeout("openDoor("+tmp+")", 1500);
    }
  }
}

//문 조정 관련.
function openDoor(tmp){
  let all_floor = document.querySelectorAll("img");
  $(all_floor).eq(5-tmp).attr("src","img/on.png");
  let key = setTimeout("closeDoor("+tmp+")", 500);
}


function closeDoor(tmp){
  let all_floor = document.querySelectorAll("img");
  call_sign[0]=tmp;
  call_sign[1]="off";
  changeTheFloorBtn(call_sign);
  $(all_floor).eq(5-tmp).attr("src","img/off.png");

  console.log("closeDoor callarray 제거");
  ev_callarray.shift();
  console.log("orderSequence arrived 접근");
  if(ev_destination==tmp && ev_callarray.length>0){ //목적지 도착
    orderSequence("arrived");
  }

  movementSequence();
  console.log("closeDoor down: "+ev_callarray);
  console.log("ev_destination: "+ev_destination);

}

//버튼 온오프 색상 변경
function changeTheFloorBtn(call_sign){
  console.log("들어옴"+call_sign);
  if (call_sign[1]=="on"){
    let btn = $("#"+call_sign[0]+"f");
    $(btn).css("background-color","red");
    $(btn).css("disabled","disabled");

  } else if (call_sign[1]="off") {
    let btn = $("#"+call_sign[0]+"f");
    $(btn).css("background-color","");
    $(btn).css("disabled","");
  }

  call_sign.shift();
  call_sign.shift();

}

//엘리베이터 작동/미작동 색상 변경
function turnOnEle(){
  $("#ev").css({"background-color":"pink", "color":"white"})
}

function turnOffEle(){
  $("#ev").css({"background-color":"", "color":""})
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
