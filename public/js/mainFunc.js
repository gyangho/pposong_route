const searchForm = document.getElementById("search-form");
const searchButton = document.getElementById("search-form-submit");


searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    const start = searchForm.start.value;
    const end = searchForm.end.value;

    if (start != 0 && end != 0) {
        console.log(start, end);
    }

});

//출발지 자동완성 기능
$(function () {
    $("#start-field").autocomplete({
        source: List,
        select: function (event, ui) {
            console.log(ui.item);
        },
        foucs: function (event, ui) {
            return false;
        },
        minLength: 1,
        delay: 100,
        close: function (event) {	//자동완성창 닫아질때 호출
            console.log(event);
        }
    }).autocomplete("instance")._renderItem = function (ul, item) {    //UI 변경하는 부분
        return $("<li>")	//기본 tag가 li로 되어 있음 
            .append("<div class=h>" + item.label + "</div>")	//여기에다가 원하는 모양의 HTML을 만들면 UI가 원하는 모양으로 변함.
            .appendTo(ul);
    };
});

//도착지 자동완성 기능
$(function () {
    $("#end-field").autocomplete({
        source: List,
        select: function (event, ui) {
            console.log(ui.item);
        },
        foucs: function (event, ui) {
            return false;
        },
        minLength: 1,
        delay: 100,
        close: function (event) {	//자동완성창 닫아질때 호출
            console.log(event);
        }
    }).autocomplete("instance")._renderItem = function (ul, item) {    //UI 변경하는 부분
        return $("<li>")	//기본 tag가 li로 되어 있음 
            .append("<div class=h>" + item.label + "</div>")	//여기에다가 원하는 모양의 HTML을 만들면 UI가 원하는 모양으로 변함.
            .appendTo(ul);
    };
});