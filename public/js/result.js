/* 뽀송길 검색 결과에서 경로 클릭 시 페이지 전환 but 별 아이콘 클릭 시 즐겨찾기 등록 및 해제 */
const routeListDivs = document.querySelectorAll(".route-list");

routeListDivs.forEach(routeListDiv => {
  routeListDiv.addEventListener("click", function(event) {

    const FULL_STAR = "fa-solid";
    const EMPTY_STAR = "fa-regular";
    const isStarClicked = event.target.classList.contains("fa-star");

    if (isStarClicked) {
      const icon = event.target;
      const isRegular = icon.classList.contains(EMPTY_STAR);

      if (isRegular) {
        icon.classList.remove(EMPTY_STAR);
        icon.classList.add(FULL_STAR);
      } else {
        icon.classList.remove(FULL_STAR);
        icon.classList.add(EMPTY_STAR);
      }
    } else {
      window.location.href = "pposongtime.html";
    }
  });
});
