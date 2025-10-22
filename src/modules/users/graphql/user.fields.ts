import { GraphQLList, GraphQLNonNull } from "graphql";
import * as userArgs from './user.args';
import { userType } from './user.types';
import userService from "../user.service";


class userFields {
    constructor() { }
    query = () => {
        return {
            getOneUser: {
                type: userType,
                args: userArgs.getUserArgs,
                resolve: userService.getOneUserGQL
            },
            getUser: {
                type: userType,
                resolve: userService.getUserGQL
            },
            getAllUsers: {
                type: new GraphQLNonNull(new GraphQLList(userType)),
                resolve: userService.getAllUsersGQL
            },
        }
    };
    mutation = () => {
        return {
            createUser: {
                type: userType,
                args: userArgs.createUserArgs,
                resolve: userService.createUserGQL
            }
        }
    }
}

export default new userFields()