/* 즐겨찾기 경로 클릭 시 페이지 전환 but 별 아이콘 클릭 시 즐겨찾기 해제 */
const bookmarkElements = document.querySelectorAll(".bookmark-component");

function handleClickEvent(event) {
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

      /* 일시적으로 없어짐, 새로고침 시 복구됨(추후에 서버랑 연동해야 함) */
      const parentDiv = icon.closest(".bookmark-component");
      if (parentDiv) {
        parentDiv.classList.add('fade-out-done');
        setTimeout(() => {
          parentDiv.remove();
        }, 600);
      }
    }
  }
}

bookmarkElements.forEach(bookmarkElement => {
  bookmarkElement.addEventListener('click', handleClickEvent);
});