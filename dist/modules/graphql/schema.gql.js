"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaGql = void 0;
const graphql_1 = require("graphql");
const user_fields_1 = __importDefault(require("../users/graphql/user.fields"));
const post_fields_js_1 = __importDefault(require("../posts/graphql/post.fields.js"));
exports.schemaGql = new graphql_1.GraphQLSchema({
    query: new graphql_1.GraphQLObjectType({
        name: "Query",
        fields: {
            ...user_fields_1.default.query(),
            ...post_fields_js_1.default.query()
        }
    }),
    mutation: new graphql_1.GraphQLObjectType({
        name: "Mutation",
        fields: {
            ...user_fields_1.default.mutation()
        }
    })
});
