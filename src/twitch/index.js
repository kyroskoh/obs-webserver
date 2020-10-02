/**
 * @typedef {import("twitch").AuthProvider} AuthProvider
 * @typedef {import("twitch-chat-client").ChatClient} ChatClient
 * @typedef {import("twitch-webhooks").Subscription} WebhooksSubscriptions
 */

const events = require("events"),
    request = require("@root/request"),
    TwitchAuth = require("twitch-auth"),
    TwitchClient = require("twitch").ApiClient,

    Chat = require("./chat"),
    ConfigFile = require("../configFile"),
    Log = require("../logging/log"),
    PubSub = require("./pubsub"),
    Webhooks = require("./webhooks"),

    settings = require("../../settings");

/** @type {string} */
let accessToken;

/** @type {AuthProvider} */
let authProvider;

/** @type {AuthProvider} */
let botAuthProvider;

/** @type {Chat} */
let botChat;

/** @type {Chat} */
let chat;

/** @type {string} */
let chatAccessToken;

/** @type {PubSub} */
let pubsub;

/** @type {NodeJS.Timeout} */
let refreshInterval;

/** @type {string} */
let refreshToken;

/** @type {TwitchClient} */
let twitchBotClient;

/** @type {TwitchClient} */
let twitchClient;

/** @type {Webhooks} */
let webhooks;

/** @type {WebhooksSubscriptions[]} */
const webhookSubscriptions = [];

const eventEmitter = new events.EventEmitter();

//  #####           #     #            #
//    #                   #            #
//    #    #   #   ##    ####    ###   # ##
//    #    #   #    #     #     #   #  ##  #
//    #    # # #    #     #     #      #   #
//    #    # # #    #     #  #  #   #  #   #
//    #     # #    ###     ##    ###   #   #
/**
 * Handles Twitch integration.
 */
class Twitch {
    //        ##
    //         #
    //  ###    #     ##    ##   ###
    // ##      #    # ##  # ##  #  #
    //   ##    #    ##    ##    #  #
    // ###    ###    ##    ##   ###
    //                          #
    /**
     * Sleeps the thread for the specified time.
     * @param {number} ms The number of milliseconds to sleep for.
     * @returns {Promise} A promise that resolves when the sleep period has completed.
     */
    static sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    //                          #
    //                          #
    //  ##   # #    ##   ###   ###    ###
    // # ##  # #   # ##  #  #   #    ##
    // ##    # #   ##    #  #   #      ##
    //  ##    #     ##   #  #    ##  ###
    /**
     * Returns the EventEmitter for Twitch events.
     * @returns {events.EventEmitter} The EventEmitter object.
     */
    static get events() {
        return eventEmitter;
    }

    //  #           #     #          #     ###          #     ##   ##     #                 #
    //  #                 #          #     #  #         #    #  #   #                       #
    // ###   #  #  ##    ###    ##   ###   ###    ##   ###   #      #    ##     ##   ###   ###
    //  #    #  #   #     #    #     #  #  #  #  #  #   #    #      #     #    # ##  #  #   #
    //  #    ####   #     #    #     #  #  #  #  #  #   #    #  #   #     #    ##    #  #   #
    //   ##  ####  ###     ##   ##   #  #  ###    ##     ##   ##   ###   ###    ##   #  #    ##
    /**
     * Gets the current Twitch bot client.
     * @returns {ChatClient} The current Twitch bot client.
     */
    static get twitchBotClient() {
        return botChat.client;
    }

    //  #           #     #          #      ##   ##     #                 #
    //  #                 #          #     #  #   #                       #
    // ###   #  #  ##    ###    ##   ###   #      #    ##     ##   ###   ###
    //  #    #  #   #     #    #     #  #  #      #     #    # ##  #  #   #
    //  #    ####   #     #    #     #  #  #  #   #     #    ##    #  #   #
    //   ##  ####  ###     ##   ##   #  #   ##   ###   ###    ##   #  #    ##
    /**
     * Gets the current Twitch client.
     * @returns {TwitchClient} The current Twitch client.
     */
    static get twitchClient() {
        return twitchClient;
    }

    //              #     ##                                   ###         #
    //              #    #  #                                   #          #
    //  ###   ##   ###   #  #   ##    ##    ##    ###    ###    #     ##   # #    ##   ###
    // #  #  # ##   #    ####  #     #     # ##  ##     ##      #    #  #  ##    # ##  #  #
    //  ##   ##     #    #  #  #     #     ##      ##     ##    #    #  #  # #   ##    #  #
    // #      ##     ##  #  #   ##    ##    ##   ###    ###     #     ##   #  #   ##   #  #
    //  ###
    /**
     * Gets the Twitch access token from the OAuth code and logs in.
     * @param {string} code The code returned from the OAuth flow.
     * @returns {Promise} A promise that resolves when the access token is retrieved.
     */
    static async getAccessToken(code) {
        const res = await request.post(`https://id.twitch.tv/oauth2/token?client_id=${settings.twitch.clientId}&client_secret=${settings.twitch.clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(`http://localhost:${settings.express.port}/oauth`)}`);

        const body = JSON.parse(res.body);

        const chatRes = await request(`https://twitchtokengenerator.com/api/refresh/${settings.twitch.chatRefreshToken}`);

        const chatBody = JSON.parse(chatRes.body);

        chatAccessToken = chatBody.token;

        await Twitch.login({accessToken: body.access_token, refreshToken: body.refresh_token});
    }

    //              #    ###            #   #                       #    #  #        ##
    //              #    #  #           #                           #    #  #         #
    //  ###   ##   ###   #  #   ##    ###  ##    ###    ##    ##   ###   #  #  ###    #
    // #  #  # ##   #    ###   # ##  #  #   #    #  #  # ##  #      #    #  #  #  #   #
    //  ##   ##     #    # #   ##    #  #   #    #     ##    #      #    #  #  #      #
    // #      ##     ##  #  #   ##    ###  ###   #      ##    ##     ##   ##   #     ###
    //  ###
    /**
     * Gets the redirect URL for logging into Twitch.
     * @returns {string} The redirect URL to log into Twitch.
     */
    static getRedirectUrl() {
        return `https://id.twitch.tv/oauth2/authorize?client_id=${settings.twitch.clientId}&redirect_uri=${encodeURIComponent(`http://localhost:${settings.express.port}/oauth`)}&response_type=code&scope=${encodeURIComponent(settings.twitch.scopes.join(" "))}`;
    }

    //  #           ###                  #
    //              #  #                 #
    // ##     ###   #  #   ##    ###   ###  #  #
    //  #    ##     ###   # ##  #  #  #  #  #  #
    //  #      ##   # #   ##    # ##  #  #   # #
    // ###   ###    #  #   ##    # #   ###    #
    //                                       #
    /**
     * Checks if the Twitch client is ready.
     * @returns {Promise<boolean>} Returns whether the Twitch client is ready.
     */
    static async isReady() {
        accessToken = accessToken || ConfigFile.get("accessToken");
        refreshToken = refreshToken || ConfigFile.get("refreshToken");

        if (!accessToken || !refreshToken || !twitchClient || !twitchBotClient || !authProvider || !botAuthProvider) {
            return false;
        }

        try {
            await authProvider.refresh();
            await botAuthProvider.refresh();
        } catch (err) {
            return false;
        }

        return true;
    }

    // ##                 #
    //  #
    //  #     ##    ###  ##    ###
    //  #    #  #  #  #   #    #  #
    //  #    #  #   ##    #    #  #
    // ###    ##   #     ###   #  #
    //              ###
    /**
     * Logs in to Twitch and creates the Twitch client.
     * @param {{accessToken: string, refreshToken: string}} tokens The tokens to login with.
     * @returns {Promise} A promise that resolves when login is complete.
     */
    static async login(tokens) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }

        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;

        authProvider = new TwitchAuth.RefreshableAuthProvider(
            new TwitchAuth.StaticAuthProvider(settings.twitch.clientId, accessToken, settings.twitch.scopes, "user"),
            {
                clientSecret: settings.twitch.clientSecret,
                expiry: null,
                refreshToken,
                onRefresh: (token) => accessToken = token.accessToken
            }
        );

        twitchClient = new TwitchClient({
            authProvider,
            initialScopes: settings.twitch.scopes,
            preAuth: true
        });

        botAuthProvider = new TwitchAuth.RefreshableAuthProvider(
            new TwitchAuth.StaticAuthProvider(settings.twitch.clientId, chatAccessToken, settings.twitch.chatScopes, "user"),
            {
                clientSecret: settings.twitch.clientSecret,
                expiry: null,
                refreshToken: settings.twitch.chatRefreshToken,
                onRefresh: (token) => chatAccessToken = token.accessToken
            }
        );

        twitchBotClient = new TwitchClient({
            authProvider: botAuthProvider,
            initialScopes: settings.twitch.chatScopes,
            preAuth: true
        });

        await Twitch.setupChat();
        await Twitch.setupPubSub();
        await Twitch.setupWebhooks();

        // TODO: Should work, but needs investigation to see if it's needed.
        // refreshInterval = setInterval(Twitch.refreshTokens, 24 * 60 * 60 * 1000);
    }

    //               #                      #     ###         #
    //              # #                     #      #          #
    // ###    ##    #    ###    ##    ###   ###    #     ##   # #    ##   ###    ###
    // #  #  # ##  ###   #  #  # ##  ##     #  #   #    #  #  ##    # ##  #  #  ##
    // #     ##     #    #     ##      ##   #  #   #    #  #  # #   ##    #  #    ##
    // #      ##    #    #      ##   ###    #  #   #     ##   #  #   ##   #  #  ###
    /**
     * Refreshes Twitch tokens.
     * @returns {Promise} A promsie that resolves when the tokens are refreshed.
     */
    static async refreshTokens() {
        try {
            await authProvider.refresh();
            await botAuthProvider.refresh();
        } catch (err) {
            eventEmitter.emit("error", {
                message: "Error refreshing twitch client tokens.",
                err
            });
        }

        await Twitch.setupChat();
        await Twitch.setupPubSub();
        await Twitch.setupWebhooks();
    }

    //               #     ##    #                            ###           #
    //               #    #  #   #                             #           # #
    //  ###    ##   ###    #    ###   ###    ##    ###  # #    #    ###    #     ##
    // ##     # ##   #      #    #    #  #  # ##  #  #  ####   #    #  #  ###   #  #
    //   ##   ##     #    #  #   #    #     ##    # ##  #  #   #    #  #   #    #  #
    // ###     ##     ##   ##     ##  #      ##    # #  #  #  ###   #  #   #     ##
    /**
     * Sets the stream's title and game.
     * @param {string} title The title of the stream.
     * @param {string} game The game.
     * @returns {Promise} A promise that resolves when the stream's info has been set.
     */
    static async setStreamInfo(title, game) {
        await twitchClient.kraken.channels.updateChannel(settings.twitch.userId, {status: title, game});
    }

    //               #                 ##   #            #
    //               #                #  #  #            #
    //  ###    ##   ###   #  #  ###   #     ###    ###  ###
    // ##     # ##   #    #  #  #  #  #     #  #  #  #   #
    //   ##   ##     #    #  #  #  #  #  #  #  #  # ##   #
    // ###     ##     ##   ###  ###    ##   #  #   # #    ##
    //                          #
    /**
     * Sets up the Twitch chat.
     * @returns {Promise} A promise that resolves when the Twitch chat is setup.
     */
    static async setupChat() {
        if (chat && chat.client) {
            try {
                await chat.client.quit();
            } catch (err) {} finally {}
        }
        chat = new Chat(twitchClient);

        if (botChat && botChat.client) {
            try {
                await botChat.client.quit();
            } catch (err) {} finally {}
        }

        botChat = new Chat(twitchBotClient);

        chat.client.onAction((channel, user, message, msg) => {
            eventEmitter.emit("action", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: msg.userInfo.displayName,
                message
            });
        });

        chat.client.onCommunityPayForward((channel, user, forwardInfo) => {
            eventEmitter.emit("subGiftCommunityPayForward", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: forwardInfo.displayName,
                originalGifter: forwardInfo.originalGifterDisplayName
            });
        });

        chat.client.onCommunitySub((channel, user, subInfo) => {
            eventEmitter.emit("subGiftCommunity", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: subInfo.gifterDisplayName,
                giftCount: subInfo.count,
                totalGiftCount: subInfo.gifterGiftCount,
                tier: subInfo.plan
            });
        });

        chat.client.onDisconnect(async (manually, reason) => {
            if (reason) {
                Log.exception("The streamer's Twitch chat disconnected.", reason);
            }

            if (!manually) {
                await Twitch.setupChat();
            }
        });

        chat.client.onGiftPaidUpgrade((channel, user, subInfo) => {
            eventEmitter.emit("subGiftUpgrade", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: subInfo.displayName,
                gifter: subInfo.gifterDisplayName,
                tier: subInfo.plan
            });
        });

        chat.client.onHost(async (channel, target, viewers) => {
            let user;
            try {
                user = (await Twitch.twitchClient.kraken.search.searchChannels(target)).find((c) => c.displayName === target);
            } catch (err) {} finally {}

            eventEmitter.emit("host", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user: user ? user.name : target,
                name: target,
                viewerCount: viewers
            });
        });

        chat.client.onHosted(async (channel, byChannel, auto, viewers) => {
            let user;
            try {
                user = (await Twitch.twitchClient.kraken.search.searchChannels(byChannel)).find((c) => c.displayName === byChannel);
            } catch (err) {} finally {}

            eventEmitter.emit("hosted", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user: user ? user.name : byChannel,
                name: byChannel.charAt(0) === "#" ? byChannel.substr(1) : byChannel,
                auto,
                viewerCount: viewers
            });
        });

        chat.client.onPrimeCommunityGift((channel, user, subInfo) => {
            eventEmitter.emit("giftPrime", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user: subInfo.gifter,
                name: subInfo.gifterDisplayName,
                gift: subInfo.name
            });
        });

        chat.client.onPrimePaidUpgrade((channel, user, subInfo) => {
            eventEmitter.emit("subPrimeUpgraded", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: subInfo.displayName,
                tier: subInfo.plan
            });
        });

        chat.client.onPrivmsg((channel, user, message, msg) => {
            eventEmitter.emit("message", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: msg.userInfo.displayName,
                message,
                msg // TODO: Implement this.
            });
        });

        chat.client.onRaid((channel, user, raidInfo) => {
            eventEmitter.emit("raided", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: raidInfo.displayName,
                viewerCount: raidInfo.viewerCount
            });
        });

        chat.client.onResub((channel, user, subInfo) => {
            eventEmitter.emit("resub", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: subInfo.displayName,
                isPrime: subInfo.isPrime,
                message: subInfo.message,
                months: subInfo.months,
                streak: subInfo.streak,
                tier: subInfo.plan
            });
        });

        chat.client.onRitual((channel, user, ritualInfo, msg) => {
            eventEmitter.emit("ritual", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: msg.userInfo.displayName,
                message: ritualInfo.message,
                ritual: ritualInfo.ritualName
            });
        });

        chat.client.onStandardPayForward((channel, user, forwardInfo) => {
            eventEmitter.emit("subGiftPayForward", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: forwardInfo.displayName,
                originalGifter: forwardInfo.originalGifterDisplayName,
                recipient: forwardInfo.recipientDisplayName
            });
        });

        chat.client.onSub((channel, user, subInfo) => {
            eventEmitter.emit("sub", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: subInfo.displayName,
                isPrime: subInfo.isPrime,
                message: subInfo.message,
                months: subInfo.months,
                streak: subInfo.streak,
                tier: subInfo.plan
            });
        });

        chat.client.onSubExtend((channel, user, subInfo) => {
            eventEmitter.emit("subExtend", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                displayName: subInfo.displayName,
                months: subInfo.months,
                tier: subInfo.plan
            });
        });

        chat.client.onSubGift((channel, user, subInfo) => {
            eventEmitter.emit("subGift", {
                channel: channel.charAt(0) === "#" ? channel.substr(1) : channel,
                user,
                name: subInfo.displayName,
                gifterUser: subInfo.gifter,
                gifterName: subInfo.gifterDisplayName,
                totalGiftCount: subInfo.gifterGiftCount,
                isPrime: subInfo.isPrime,
                message: subInfo.message,
                months: subInfo.months,
                streak: subInfo.streak,
                tier: subInfo.plan
            });
        });

        chat.client.onWhisper((user, message, msg) => {
            eventEmitter.emit("whisper", {
                user,
                name: msg.userInfo.displayName,
                message
            });
        });

        botChat.client.onDisconnect(async (manually, reason) => {
            if (reason) {
                Log.exception("The bot's Twitch chat disconnected.", reason);
            }

            if (!manually) {
                await Twitch.setupChat();
            }
        });

        chat.client.connect();
        botChat.client.connect();
    }

    //               #                ###         #      ##         #
    //               #                #  #        #     #  #        #
    //  ###    ##   ###   #  #  ###   #  #  #  #  ###    #    #  #  ###
    // ##     # ##   #    #  #  #  #  ###   #  #  #  #    #   #  #  #  #
    //   ##   ##     #    #  #  #  #  #     #  #  #  #  #  #  #  #  #  #
    // ###     ##     ##   ###  ###   #      ###  ###    ##    ###  ###
    //                          #
    /**
     * Sets up the Twitch PubSub subscriptions.
     * @returns {Promise} A promise that resolves when the Twitch PubSub subscriptions are setup.
     */
    static async setupPubSub() {
        pubsub = new PubSub();

        await pubsub.setup(twitchClient);

        pubsub.client.onBits(settings.twitch.userId, async (message) => {
            eventEmitter.emit("bits", {
                userId: message.userId,
                user: message.userName,
                name: (await message.getUser()).displayName,
                bits: message.bits,
                totalBits: message.totalBits,
                message: message.message,
                isAnonymous: message.isAnonymous
            });
        });

        pubsub.client.onRedemption(settings.twitch.userId, (message) => {
            eventEmitter.emit("redemption", {
                userId: message.userId,
                user: message.userName,
                name: message.userDisplayName,
                message: message.message,
                date: message.redemptionDate,
                cost: message.rewardCost,
                reward: message.rewardName,
                isQueued: message.rewardIsQueued
            });
        });
    }

    //               #                #  #        #     #                 #
    //               #                #  #        #     #                 #
    //  ###    ##   ###   #  #  ###   #  #   ##   ###   ###    ##    ##   # #    ###
    // ##     # ##   #    #  #  #  #  ####  # ##  #  #  #  #  #  #  #  #  ##    ##
    //   ##   ##     #    #  #  #  #  ####  ##    #  #  #  #  #  #  #  #  # #     ##
    // ###     ##     ##   ###  ###   #  #   ##   ###   #  #   ##    ##   #  #  ###
    //                          #
    /**
     * Sets up the Twitch Webhooks subscriptions.
     * @returns {Promise} A promise that resolves when the Twitch Webhooks subscriptions are setup.
     */
    static async setupWebhooks() {
        if (webhooks && webhooks.listener) {
            for (const sub of webhookSubscriptions) {
                await sub.stop();
            }
        }

        await Twitch.sleep(1000);

        webhooks = new Webhooks();

        await webhooks.setup(twitchClient);

        webhookSubscriptions.push(await webhooks.listener.subscribeToFollowsToUser(settings.twitch.userId, async (follow) => {
            eventEmitter.emit("follow", {
                userId: follow.userId,
                user: (await follow.getUser()).name,
                name: follow.userDisplayName,
                date: follow.followDate
            });
        }));

        webhookSubscriptions.push(await webhooks.listener.subscribeToStreamChanges(settings.twitch.userId, async (stream) => {
            if (stream) {
                const game = await stream.getGame();

                eventEmitter.emit("stream", {
                    title: stream.title,
                    game: game ? game.name : "",
                    id: stream.id,
                    startDate: stream.startDate,
                    thumbnailUrl: stream.thumbnailUrl
                });
            } else {
                eventEmitter.emit("offline");
            }
        }));
    }
}

module.exports = Twitch;
