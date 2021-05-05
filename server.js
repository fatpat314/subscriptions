const { ApolloServer, gql, PubSub } = require('apollo-server');

const pubsub = new PubSub();

const typeDefs = gql`
    type Post {
        message: String!
        date: String!
    }

    type Channel {
        name: String!
        posts: [Post!]
    }

    type Query {
        posts(channel: String!): [Post!]
        channels: [Channel!]!
    }

    type Mutation {
        addPost(channel: String!, message: String!): Post
        addChannel(name: String!): Channel
    }

    type Subscription {
        newPost(channel: String!): Post
        newChannel: Channel!
    }
`

// [{ name: "Main", posts: [{ message: "somethig", date: "" }] }]
// Data Store
const data = {
  Main: [ { message: 'hello world', date: new Date() } ],
  Cats: [ { message: 'Meow', date: new Date() }]
}

// const channels = [
//     { channel: 'channel1', posts: [] },
//     { channel: 'channel2', posts: [] }
// ]

const resolvers = {
    Query: {
        posts: (_, { channel }) => data[channel],
        channels: () => {
            const keys = Object.keys(data)
            return keys.map(name => ({ name, posts: data[name] }))
        }
    },
    Mutation: {
        addPost: (_, { channel, message }) => {
            const post = { message, date: new Date() }
            data.push(post)
            pubsub.publish('NEW_POST', { newPost: post }) // Publish!
            return post
        },
        addChannel: (_, { name }) => {
            const channel = { name }
            data.push(channel)
            pubsub.publish('New_Channel', { newChannel: channel })
            return channel
        }
    },
    Subscription: {
        newPost: {
            subscribe: (_, { channel }) => {
                pubsub.asyncIterator('NEW_POST')
            }
        },
        newChannel: {
            subscribe: () => {
                pubsub.asyncIterator('NEW_Channel')
            }
        }
    },
    Channel: {
        name: (parent) => {
            return parent.name
        },
        posts: (parent) => {
            return parent.posts
        }
    },
    Post: {
        message: (parent) => {
            return parent.message
        },
        date: (parent) => {
            return new Date(parent.date.toLocaleDateString())
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
});

server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});
