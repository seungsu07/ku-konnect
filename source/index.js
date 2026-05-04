// JSDoc 작성법 간편하게 알려줄게

/** */
// /** */ << 이게 JSDoc 전용 주석임

/**
 * @type {number}
 */
let a;

// a에 커서 올려봐
// 타입이 뜨지

/**
 * @returns {string | RegExp}
 * @param {number} num
 */
function num2str(num) {
    return String(num);
}

// num에 커서 올리면 넘버 되고
// num2str에 커서올리면 리턴값 보임
// 2는 to

/**
 * @typedef {object} MyType
 * @property {number} num
 * @property {string} name
 */
// MyType 위에 커서 올려봐

/** @type {MyType} */
let m = { num: 1, name: '한영진' };
// m. 까지만 쳐봐
// 속성이 뜸
m.name = 1; // 오류 보이지

// 이게 JSDoc 기본 문법이고 모르는건 제미나이한테 물어보면됨
// 이런식으로 자스 장점하고 ts 장점 둘 다 챙길 수 있음