const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        user: async (parent, { username }) => {
            return User.findOne({ username })
        }
    },
    Mutation: {
        createUser: async (parent, {username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('No user found with this email address');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { authors, description, bookId, image, link, title }, context) => {
            if (context.user) {
                const user = await User.findOneAndUpdate({ _id: context.user._id }, { $addToSet: {
                    savedBooks: {
                        authors: authors,
                        description: description,
                        bookId: bookId,
                        image: image,
                        link: link,
                        title: title
                    }
                }});
                return user;
            }
            throw new AuthenticationError('You must be logged in');
        }, // TODO: syntax
        deleteBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const user = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: {savedBooks: {bookId: bookId} } }
                );
                return User;
            }
            throw new AuthenticationError('You must be logged in');
        }
    }
};

module.exports = resolvers;