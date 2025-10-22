"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userType = exports.genderEnumGQL = void 0;
const graphql_1 = require("graphql");
const user_model_1 = require("../../../DB/models/user.model");
exports.genderEnumGQL = new graphql_1.GraphQLEnumType({
    name: "genderEnum",
    values: {
        male: { value: user_model_1.GenderType.male },
        female: { value: user_model_1.GenderType.female },
    }
});
const userFiendType = new graphql_1.GraphQLObjectType({
    name: "userFriend",
    fields: {
        fName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        lName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        userName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    },
});
exports.userType = new graphql_1.GraphQLObjectType({
    name: "user",
    fields: {
        _id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        fName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        lName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        userName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        password: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        age: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
        gender: { type: new graphql_1.GraphQLNonNull(exports.genderEnumGQL) },
        friends: { type: new graphql_1.GraphQLList(userFiendType) }
    }
});
