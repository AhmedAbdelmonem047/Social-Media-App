import {  GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { genderEnumGQL } from "./user.types";

export const getUserArgs = {
    id: { type: new GraphQLNonNull(GraphQLID) }
}

export const createUserArgs = {
    fName: { type: new GraphQLNonNull(GraphQLString) },
    lName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    age: { type: new GraphQLNonNull(GraphQLInt) },
    gender: { type: new GraphQLNonNull(genderEnumGQL) },
}