var infowindow = new kakao.maps.CustomOverlay({zIndex:9,clickable:true});
var mapOption = {
    center: new kakao.maps.LatLng(33.4547007634407, 126.565112951543), // 지도의 중심좌표
    level: 3 // 지도의 확대 레벨
};

var map = new kakao.maps.Map(document.getElementById('map'), mapOption);


function findArea(placeName) {
// 건물이 어떤 area에 속해있는지 (제주대학교 캠퍼스맵 기준) http://www.jejunu.ac.kr/popups/58fc5e8bd9dd2
    for (let i = 0; i < colleges.length; i++) {
        for (let building of colleges[i]) 
            if (('제주대학교'+building[1]).indexOf(placeName)!=-1) 
                return i;
    }
    return -1;
}

function refineData(raw) {// 데이터를 객체로 저장
    let data = []
    for (let i of raw) {
        dataObj = {
            place_name:i[0],
            x:parseFloat(i[1]),
            y:parseFloat(i[2]),
        };
        let area = findArea(i[0]);
        if (area!=-1){
            dataObj.area = area;
        }
        data.push(dataObj);
    }
    return data;
}

function drawMap(mapOption){
    // 지도를 생성합니다    
    let data = refineData(facilities);
    let area = new Array(8);
    let rectangles = [];
    let markers = new Array(8);
    for (let i=0;i<area.length;i++) {
        area[i] = [];
        markers[i] = [];
    }

    for (let obj of data) {// 모든 건물들에 대해
        // displayMarker(obj,map);//마커 표시
        if (obj.area!=undefined) { //건물이 속한 area가 있으면 건물을 따로 저장
            area[obj.area].push(obj);
        }
    }
    
    for (let i = 0; i < area.length; i++) {// area에 속한 건물들 사각형으로 묶음
        let minX=127,minY=34,maxX=126,maxY=33; // 꼭짓점 초기화
        for (let building of area[i]) {
            //// 사각형 꼭짓점 구하기
            if(maxX-parseFloat(building.x) < 0) {
                maxX=parseFloat(building.x);
            }
            if(maxY-parseFloat(building.y) < 0) {
                maxY=parseFloat(building.y);
            }
            if(minX-parseFloat(building.x) > 0) {
                minX=parseFloat(building.x);
            }
            if(minY-parseFloat(building.y) > 0) {
                minY=parseFloat(building.y);
            }
            ////
            markers[i].push(displayMarker(building));// area에 속한 건물 표시
        }
        rectangles.push(displayRect(minX,minY,maxX,maxY,colors[i]));
    }

    for (let i = 0; i<area.length; i++) {
        // 작은 다각형이 가려지는 현상이 발생하여 zIndex를 설정함 임시
        rectangles[i].setZIndex(-i);
        rectangles[i].setMap(map);
        // 다각형에 클릭이벤트 등록
        kakao.maps.event.addListener(rectangles[i],'mousedown',function() {
            console.log(i);
            if (prevMarker!=undefined) {// 이전에 선택된 영역의 마커 다 지움
                for (let marker of markers[prevMarker]) {
                    marker.setMap(null);
                }
            }
            for (let marker of markers[i]) {
                marker.setMap(map);
            }
            prevMarker=i;
        });
    }
}
var prevMarker;

function displayMarker(place) {
    // 마커를 생성
    var marker = new kakao.maps.Marker({
        zIndex:1,
        position: new kakao.maps.LatLng(place.y, place.x) 
    });
    // 마커에 클릭이벤트를 등록합니다
    kakao.maps.event.addListener(marker, 'click', function() {
        // 마커를 클릭하면 커스텀 오버레이
        // document.getElementById('Jmap').style.width = '50%';// 지도 크기 변경
        map.relayout();

        let contents = '<div class="info-container">\
                            <div class="title">' + place.place_name.slice(5) + '\
                                <div class="close" onclick="overlayClose()" title="닫기">X</div>\
                            </div>';

        //// 오버레이 내용
        for (let i in place) {  
            contents +=     '<div class="content">' + i +'</div>';
        }
        ////
        contents+=      '</div>';
        infowindow.setContent(contents);
        infowindow.setPosition(marker.getPosition());
        infowindow.setMap(map);
        map.panTo(marker.getPosition());// 마커를 중심으로 부드럽게 이동
    });
    // marker.setMap(map);
    return marker;

}
function overlayClose() {
    infowindow.setMap(null);
}
function displayRect(minX,minY,maxX,maxY,color) {
    // 사각형을 구성하는 영역정보를 생성합니다
    let padding=0.0002;
    let path = [ 
        new kakao.maps.LatLng(maxY+padding,maxX+padding),
        new kakao.maps.LatLng(minY-padding,maxX+padding),
        new kakao.maps.LatLng(minY-padding,minX-padding),
        new kakao.maps.LatLng(maxY+padding,minX-padding)
    ]

    // 지도에 표시할 사각형을 생성합니다
    var rectangle = new kakao.maps.Polygon({
            path:path,
            strokeWeight: 4, // 선의 두께입니다
            strokeColor: color, // 선의 색깔입니다, 인수로 받음
            strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
            strokeStyle: 'shortdashdot', // 선의 스타일입니다
            fillColor: color, // 채우기 색깔입니다
            fillOpacity: 0.2 // 채우기 불투명도 입니다
        });
    return rectangle;
}

drawMap(mapOption);// 실행