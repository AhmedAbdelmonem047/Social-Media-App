"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePostGQL = exports.getAllPostsPaginated = void 0;
const graphql_1 = require("graphql");
const post_types_1 = require("./post.types");
exports.getAllPostsPaginated = {
    page: { type: graphql_1.GraphQLInt },
    limit: { type: graphql_1.GraphQLInt },
};
exports.likePostGQL = {
    postId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
    action: { type: post_types_1.actionEnumGQL },
};
