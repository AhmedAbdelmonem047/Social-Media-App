"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserArgs = exports.getUserArgs = void 0;
const graphql_1 = require("graphql");
const user_types_1 = require("./user.types");
exports.getUserArgs = {
    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) }
};
exports.createUserArgs = {
    fName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    lName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    password: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    age: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
    gender: { type: new graphql_1.GraphQLNonNull(user_types_1.genderEnumGQL) },
};
