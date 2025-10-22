"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postType = exports.actionEnumGQL = void 0;
const graphql_1 = require("graphql");
const post_validation_1 = require("../post.validation");
exports.actionEnumGQL = new graphql_1.GraphQLEnumType({
    name: "actionEnum",
    values: {
        like: { value: post_validation_1.ActionType.like },
        unlike: { value: post_validation_1.ActionType.unlike },
    }
});
exports.postType = new graphql_1.GraphQLObjectType({
    name: "Post",
    fields: {
        content: { type: graphql_1.GraphQLString },
        attatchments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        assetFolderId: { type: graphql_1.GraphQLString },
        createdBy: { type: graphql_1.GraphQLID },
        tags: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        likes: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
    }
});
