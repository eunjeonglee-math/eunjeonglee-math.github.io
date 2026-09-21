# Eunjeong Lee — Academic Homepage

Google Sites의 공개 콘텐츠를 바탕으로 정리한 정적 개인 홈페이지입니다. 별도 서버나 데이터베이스 없이 GitHub Pages에서 바로 동작합니다.

## 페이지 구성

- `index.html` — 소개, 연구 분야, 수상·연구비, 경력, 학력
- `cv-export.html` — 인쇄하거나 PDF로 저장할 수 있는 CV
- `publications.html` — 논문 34편과 공동저자 태그 필터
- `members.html` — 대학원생, 졸업생, 학부 연구인턴
- `activities.html` — 발표, 초청강연, 행사 조직, 세미나
- `photos.html` — 15개 행사의 사진 32장, 다중 사진 좌우 캐러셀, 클릭형 연도·나라·사람 태그 필터

## GitHub Pages에 올리기

1. GitHub에서 새 저장소를 만듭니다. 개인 홈페이지 주소를 `https://사용자명.github.io`로 쓰려면 저장소 이름도 `사용자명.github.io`로 지정합니다.
2. 이 폴더의 파일 전체를 저장소 기본 브랜치(`main`)에 올립니다.
3. 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
4. `main` 브랜치에 변경사항이 올라오면 포함된 배포 작업이 자동으로 사이트를 갱신합니다.

## 내용 수정

논문과 사진은 HTML을 직접 고치지 않고 아래 두 데이터 파일만 수정하면 됩니다.

- `assets/data/publications.js` — 논문을 추가하거나 수정하는 곳입니다. 여기서 바꾼 내용은 **Publications 페이지와 CV에 동시에** 반영됩니다. 논문은 최신 항목이 위에 오도록 `works` 맨 앞에 추가합니다. 번호, 전체 논문 수, 출판 연도 범위는 자동으로 계산됩니다. 새 공동저자는 위쪽 `coauthors`에 한 번 등록한 뒤 논문의 `authors`에서 그 짧은 키를 사용합니다. 홈페이지 주소가 있으면 `homepage`에 넣습니다.
- `assets/data/photos.js` — 사진 행사를 추가하거나 수정하는 곳입니다. 행사 수, 사진 수, 연도 범위, 태그, 여러 사진 좌우 넘기기는 자동으로 만들어집니다. 행사는 화면에 보일 순서대로 `events`에 넣습니다. 새 나라나 사람은 위쪽 `countries` 또는 `people`에 먼저 등록합니다.

사진 파일 자체는 `assets/images` 폴더에 넣고, `assets/data/photos.js`의 해당 행사 `images` 목록에 파일 경로, 설명(`alt`), 실제 가로·세로 크기를 적습니다. 한 행사에 사진이 여러 장이면 같은 `images` 목록에 이어서 추가하면 좌우 넘기기 방식으로 표시됩니다.

두 데이터 파일의 맨 위 `lastUpdated` 날짜도 내용을 바꾼 날에 함께 수정합니다. 쉼표나 따옴표를 빠뜨리면 목록이 표시되지 않으므로, 기존 항목 하나를 복사한 뒤 내용만 바꾸는 방식이 가장 안전합니다.

새 출판 논문은 `works` 맨 앞쪽의 알맞은 연도 위치에 아래 형태로 넣습니다. 제출 중인 논문이 출판되면 새 항목을 만들지 말고 기존 항목의 `category`, `year`, `url`, `venue`, `citation`을 고친 뒤 `status` 줄은 지웁니다.

```js
{
  category: "published",
  year: 2027,
  title: "Paper title",
  url: "https://논문-페이지",
  authors: ["coauthor-key"],
  venue: "Journal name",
  citation: "권·호·쪽수 등",
  arxiv: "2601.12345",
},
```

새 사진 행사는 `events` 맨 앞쪽의 알맞은 날짜 위치에 아래 형태로 넣습니다. `images` 안에 사진을 두 장 이상 적으면 별도 작업 없이 좌우 넘기기가 생깁니다.

```js
{
  year: 2027,
  country: "south-korea",
  people: ["eunjeong-lee", "person-key"],
  title: "Event title",
  url: "https://행사-페이지",
  details: "Month 1–3 · Place",
  images: [
    { src: "assets/images/photo-01.jpg", alt: "사진 설명", width: 1600, height: 1200 },
    { src: "assets/images/photo-02.jpg", alt: "사진 설명", width: 1600, height: 1200 },
  ],
},
```

그 밖의 소개, 구성원, 활동 기록은 해당 HTML 파일에서 수정하며, 공통 디자인은 `assets/css/styles.css`, 메뉴와 필터 동작은 `assets/js/site.js`에 있습니다.

기존 사이트에서 확인이 필요한 두 항목은 그대로 보존하거나 일관된 최신 기록을 우선했습니다.

- AJOU–CBNU–PNU Toric Topology Seminar 시작일은 Organization 페이지와 일치하도록 2026년 3월로 표기했습니다.
- Jeongsoo Kim은 기존 사이트에서 alumni 아래에 있으면서 종료일이 `present`로 되어 있어 해당 날짜를 그대로 보존했습니다.
