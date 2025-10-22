import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderType } from "../../../DB/models/user.model";

export const genderEnumGQL = new GraphQLEnumType({
    name: "genderEnum",
    values: {
        male: { value: GenderType.male },
        female: { value: GenderType.female },
    }
})

const userFiendType = new GraphQLObjectType({
    name: "userFriend",
    fields: {
        fName: { type: new GraphQLNonNull(GraphQLString) },
        lName: { type: new GraphQLNonNull(GraphQLString) },
        userName: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
    },
})


export const userType = new GraphQLObjectType({
    name: "user",
    fields: {
        _id: { type: new GraphQLNonNull(GraphQLID) },
        fName: { type: new GraphQLNonNull(GraphQLString) },
        lName: { type: new GraphQLNonNull(GraphQLString) },
        userName: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        gender: { type: new GraphQLNonNull(genderEnumGQL) },
        friends: { type: new GraphQLList(userFiendType) }
    }
})