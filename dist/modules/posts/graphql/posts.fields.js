"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const post_service_1 = __importDefault(require("../post.service"));
const posts_types_1 = require("./posts.types");
class postFields {
    constructor() { }
    query = () => {
        return {
            getAllPosts: {
                type: new graphql_1.GraphQLList(posts_types_1.postType),
                resolve: post_service_1.default.getAllPosts
            },
        };
    };
}
exports.default = new postFields();
