// ==========================================
// 📦 창고 파렛트 렉 - 구글 드라이브 스프레드시트 연동 스크립트
// ==========================================
// 사용 방법:
// 1. 구글 드라이브(drive.google.com)에서 [새로 만들기] -> [Google 스프레드시트]를 만듭니다.
//    (시트 이름: '창고_파렛트렉_DB')
// 2. 상단 메뉴에서 [확장 프로그램] -> [Apps Script]를 클릭합니다.
// 3. 기존 코드를 모두 지우고 아래 코드를 그대로 복사해서 붙여넣습니다.
// 4. 우측 상단 파란색 [배포] 버튼 -> [새 배포] 클릭
// 5. 톱니바퀴 아이콘 -> [웹 앱] 선택
//    - 설명: 창고 렉 API
//    - 다음 사용자로 실행: 나(내 계정)
//    - 액세스 권한이 있는 사용자: [모든 사용자(Anyone)]  <-- 중요! (로그인 없이 전 직원이 접근 가능)
// 6. [배포] 누르고 '액세스 승인' 완료 후 나오는 [웹 앱 URL]을 복사하여 앱에 입력하면 끝!

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var result = {};
  
  // 첫 행이 헤더라면 2번째 행부터 읽기 (A열: 슬롯코드, B열: 기재내용)
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    if (key) {
      result[key] = val || "";
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // action이 'batch'이면 전체 데이터 덮어쓰기/동기화
    if (contents.action === "batch") {
      var allData = contents.data; // { "A-01-1-L": "...", ... }
      sheet.clearContents();
      
      var rows = [["슬롯코드", "기재정보", "최종수정시간"]];
      var now = new Date();
      var timeStr = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
      
      for (var key in allData) {
        if (allData.hasOwnProperty(key)) {
          rows.push([key, allData[key], timeStr]);
        }
      }
      
      if (rows.length > 0) {
        sheet.getRange(1, 1, rows.length, 3).setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: rows.length - 1 }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    // action이 'single'이면 단일 슬롯 즉시 업데이트
    else if (contents.action === "single") {
      var slotKey = contents.slotKey;
      var value = contents.value;
      var now = new Date();
      var timeStr = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
      
      var data = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      if (data.length <= 1 && (!data[0] || data[0][0] !== "슬롯코드")) {
        sheet.getRange(1, 1, 1, 3).setValues([["슬롯코드", "기재정보", "최종수정시간"]]);
      }
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === slotKey) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow > 0) {
        sheet.getRange(foundRow, 2, 1, 2).setValues([[value, timeStr]]);
      } else {
        sheet.appendRow([slotKey, value, timeStr]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", slotKey: slotKey }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "알 수 없는 요청" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
