import bootstrap from "./app.controller";

bootstrap();

// const paginateArray = (page: number = 1, limit: number = 5): number[] => {
//     const range = page < 2 ? -(page * limit) : [-(page * limit), -((page - 1) * limit)]
//     return Array.isArray(range) ? x.slice(...range) : x.slice(range);
// }

// const getRange = (page: number = 1, limit: number = 5) => {
//     return page < 2 ? -(page * limit) : [-(page * limit), -((page - 1) * limit)]
// }

// const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];

// let page = 1, limit = 5, range
// if (page < 2)
//     page = 1;
// page = page * 1 || 1;

// let result = paginateArray(page, limit)
// range = getRange(page, limit)
// console.log("page =", page, result, range);

// page = 2
// result = paginateArray(page, limit)
// range = getRange(page, limit)
// console.log("page =", page, result, range);

// page = 3
// result = paginateArray(page, limit)
// range = getRange(page, limit)
// console.log("page =", page, result, range);

// page = 4
// result = paginateArray(page, limit)
// range = getRange(page, limit)
// console.log("page =", page, result, range);

// page = 5
// result = paginateArray(page, limit)
// range = getRange(page, limit)
// console.log("page =", page, result, range);

// page = 6
// result = paginateArray(page, limit)
// range = getRange(page, limit)
// console.log("page =", page, result, range);