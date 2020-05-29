//   ###
//  #   #
//  #       ###   ## #    ###
//  #          #  # # #  #   #
//  #  ##   ####  # # #  #####
//  #   #  #   #  # # #  #
//   ###    ####  #   #   ###
/**
 * A class that provides functions for the game scene.
 */
class Game {
    //                     #
    //                     #
    //  ##    ##    ###   ###
    // #     #  #  ##      #
    // #     #  #    ##    #
    //  ##    ##   ###      ##
    /**
     * Gets the byte cost for a value.
     * @param {number} bytes The number of bytes.
     * @returns {string} The byte cost.
     */
    static cost(bytes) {
        const format = Intl.NumberFormat().format;

        if (bytes < 1024) {
            return `${format(bytes)} Bytes`;
        } else if (bytes < 1024 * 1024) {
            return `${format(Math.floor(bytes / 1024))} Kilobytes`;
        } else if (bytes < 1024 * 1024 * 1024) {
            return `${format(Math.floor(bytes / (1024 * 1024)))} Megabytes`;
        } else if (bytes < 1024 * 1024 * 1024 * 1024) {
            return `${format(Math.floor(bytes / (1024 * 1024 * 1024)))} Gigabytes`;
        }

        return `${format(Math.floor(bytes / (1024 * 1024 * 1024 * 1024)))} Terabytes`;
    }

    //              #    ###    #                #  #
    //              #     #                      ## #
    //  ###   ##   ###    #    ##     ##   ###   ## #   ###  # #    ##
    // #  #  # ##   #     #     #    # ##  #  #  # ##  #  #  ####  # ##
    //  ##   ##     #     #     #    ##    #     # ##  # ##  #  #  ##
    // #      ##     ##   #    ###    ##   #     #  #   # #  #  #   ##
    //  ###
    /**
     * Gets the tier name based on the data from the Twitch API.
     * @param {string} tier The tier from the Twitch API.
     * @param {boolean} isPrime Whether the sub is a Prime sub.
     * @returns {string} The tier name.
     */
    static getTierName(tier, isPrime) {
        switch (tier) {
            case "2000":
                return "Firebomber";
            case "3000":
                return "Pyromaniac";
            case "Prime":
            case "1000":
            default:
                return `${isPrime || tier === "Prime" ? "Prime " : ""}Demolitionist`;
        }
    }

    //              #     #      #
    //              #           # #
    // ###    ##   ###   ##     #    #  #
    // #  #  #  #   #     #    ###   #  #
    // #  #  #  #   #     #     #     # #
    // #  #   ##     ##  ###    #      #
    //                                #
    /**
     * Start a notification.
     * @param {string} image The image for the notification.
     * @param {string} sound The sound to use for the notification.
     * @param {string} html The HTML of the notification.
     * @returns {void}
     */
    static notify(image, sound, html) {
        const notification = document.getElementById("notification"),
            support = document.getElementById("support"),
            recent = document.getElementById("recent");

        let timeout = 1;

        if (Game.notifyTimeout) {
            notification.innerHTML = "";
            notification.classList.remove("ease-in");
            notification.classList.remove("fade-out");
            clearTimeout(Game.notifyTimeout);
        } else {
            support.classList.add("fade-out");
            recent.classList.add("fade-out");
            timeout = 500;
        }

        Game.notifyTimeout = setTimeout(() => {
            notification.innerHTML = window.GameNotificationView.get(image, sound, html);
            notification.classList.add("ease-in");

            Game.notifyTimeout = setTimeout(() => {
                notification.classList.remove("ease-in");
                notification.classList.add("fade-out");

                Game.notifyTimeout = setTimeout(() => {
                    support.innerHTML = window.GameSupportView.get();
                    recent.innerHTML = window.GameRecentView.get();
                    notification.innerHTML = "";
                    support.classList.remove("fade-out");
                    recent.classList.remove("fade-out");
                    notification.classList.remove("fade-out");

                    Game.notifyTimeout = void 0;
                }, 500);
            }, 10000);
        }, timeout);
    }

    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###
    // ##      #    #  #  #  #   #
    //   ##    #    # ##  #      #
    // ###      ##   # #  #       ##
    /**
     * Starts the intro scene.
     * @returns {void}
     */
    static start() {
        window.handleMessage = (ev) => {
            const format = Intl.NumberFormat().format;

            switch (ev.type) {
                case "settings":
                    switch (ev.data.type) {
                        case "roncliGaming":
                            document.getElementById("title").innerHTML = window.GameTitleView.get(ev.data.data.title);
                            document.getElementById("info").innerHTML = window.GameInfoView.get(ev.data.data.info);
                            break;
                    }
                    break;
                case "updateSpotify":
                    {
                        const lastTrack = ev.track ? JSON.stringify({
                            artist: ev.track.artist,
                            title: ev.track.title,
                            imageUrl: ev.track.imageUrl
                        }) : void 0;

                        if (lastTrack !== Game.lastTrack) {
                            document.getElementById("spotify").innerHTML = window.GameSpotifyView.get(ev.track);
                        }

                        Game.lastTrack = lastTrack;
                    }
                    break;
                case "clearSpotify":
                    document.getElementById("spotify").innerHTML = "";
                    break;
                case "notification":
                    switch (ev.data.type) {
                        case "bits":
                            if (!window.Home.data.bits) {
                                window.Home.data.bits = {};
                            }

                            {
                                const bits = window.Home.data.bits;

                                if (ev.data.data.isAnonymous) {
                                    ev.data.data.userId = "Anonymous";
                                    ev.data.data.name = "Anonymous";
                                    ev.data.data.totalBits = void 0;
                                }

                                if (!bits[ev.data.data.userId]) {
                                    bits[ev.data.data.userId] = {};
                                }

                                const user = bits[ev.data.data.userId];

                                user.name = ev.data.data.name;
                                user.bits = (user.bits || 0) + ev.data.data.bits;
                                user.totalBits = ev.data.data.totalBits;
                            }

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                    <span class="text">Bits x${ev.data.data.bits}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliYouKnowIt-56.png", "/media/bits.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                    <span class="text">cheered with</span>
                                    <span class="header">${format(ev.data.data.bits)}</span>
                                    <span class="text">bits${ev.data.data.totalBits ? /* html */`, for a total of</span>
                                    <span class="header">${format(ev.data.data.totalBits)}` : ""}!</span>${ev.data.data.message ? /* html */`<br />
                                    <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                </div>
                            `);

                            break;
                        case "follow":
                            if (!window.Home.data.follow) {
                                window.Home.data.follow = {};
                            }

                            window.Home.data.follow[ev.data.data.userId] = ev.data.data;

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                    <span class="text">New Follower</span>
                                </div>
                            `);

                            Game.notify("/images/roncliBoom-56.png", "/media/follow.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                    <span class="text">has joined the Boom Team!</span>
                                </div>
                            `);

                            break;
                        case "giftPrime":
                            if (!window.Home.data.giftPrime) {
                                window.Home.data.giftPrime = {};
                            }

                            {
                                const giftPrime = window.Home.data.giftPrime;

                                if (!giftPrime[ev.data.data.user]) {
                                    giftPrime[ev.data.data.user] = [];
                                }

                                const user = giftPrime[ev.data.data.user];

                                user.push({
                                    name: ev.data.data.gifter,
                                    recipient: ev.data.data.user,
                                    gift: ev.data.data.gift
                                });
                            }

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.gifter)}</span>
                                    <span class="text">Prime Gift to</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliHype-56.png", "/media/prime-gift.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.gifter)}</span>
                                    <span class="text">gave</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">a Prime Gift!</span>
                                </div>
                            `);

                            break;
                        case "hosted":
                            if (!window.Home.data.hosted) {
                                window.Home.data.hosted = {};
                            }

                            window.Home.data.hosted[ev.data.data.user] = {
                                name: ev.data.data.user,
                                viewerCount: ev.data.data.viewerCount,
                                auto: ev.data.data.auto
                            };

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Hosted${ev.data.data.viewerCount ? ` x${ev.data.data.viewerCount}` : ""}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliYouKnowIt-56.png", "/media/host-raid.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">is ${ev.data.data.auto ? "auto-" : ""}hosting the channel${ev.data.data.viewerCount ? /* html */` with</span>
                                    <span class="header">${format(ev.data.data.viewerCount)}</span>
                                    <span class="text">${ev.data.data.viewerCount === 1 ? "viewer" : "viewers"}` : ""}!</span>
                                </div>
                            `);

                            break;
                        case "raided":
                            if (!window.Home.data.raided) {
                                window.Home.data.raided = {};
                            }

                            window.Home.data.raided[ev.data.data.user] = {
                                name: ev.data.data.user,
                                viewerCount: ev.data.data.viewerCount
                            };

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Raided${ev.data.data.viewerCount ? ` x${ev.data.data.viewerCount}` : ""}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliYouKnowIt-56.png", "/media/host-raid.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">is raiding the channel${ev.data.data.viewerCount ? /* html */` with</span>
                                    <span class="header">${format(ev.data.data.viewerCount)}</span>
                                    <span class="text">${ev.data.data.viewerCount === 1 ? "raider" : "raiders"}` : ""}!</span>
                                </div>
                            `);

                            break;
                        case "redemption":
                            switch (ev.data.data.reward) {
                                case "Noita: Eh, Steve":
                                    Game.notify("/images/roncliWhatever-56.png", "/media/eh-steve.ogg", /* html */`
                                        <div>
                                            <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                            <span class="text">has spent</span>
                                            <span class="header">${Game.cost(ev.data.data.cost)}</span>
                                            <span class="text">to say hi to</span>
                                            <span class="header">Steve.</span>${ev.data.data.message ? /* html */`<br />
                                            <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                        </div>
                                    `);

                                    break;
                                case "This is fine":
                                    Game.notify("/images/roncliFine-56.png", void 0, /* html */`
                                        <div>
                                            <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                            <span class="text">has spent</span>
                                            <span class="header">${Game.cost(ev.data.data.cost)}</span>
                                            <span class="text">to</span>
                                            <span class="header">turn up the heat.</span>${ev.data.data.message ? /* html */`<br />
                                            <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                        </div>
                                    `);

                                    window.Home.ws.send(JSON.stringify({
                                        type: "action",
                                        data: {
                                            overlay: "fire",
                                            soundPath: "/media/fire.ogg"
                                        }
                                    }));

                                    break;
                                case "VIP Badge":
                                    Game.notify("/images/roncliHype-56.png", "/media/redemption.ogg", /* html */`
                                        <div>
                                            <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                            <span class="text">has spent</span>
                                            <span class="header">${Game.cost(ev.data.data.cost)}</span>
                                            <span class="text">to become a</span>
                                            <span class="header">Channel VIP!</span>${ev.data.data.message ? /* html */`<br />
                                            <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                        </div>
                                    `);

                                    break;
                                case "You know it":
                                    Game.notify("/images/roncliYouKnowIt-56.png", "/media/you-know-it.ogg", /* html */`
                                        <div>
                                            <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                            <span class="text">has spent</span>
                                            <span class="header">${Game.cost(ev.data.data.cost)}.</span>
                                            <span class="header">You know it!</span>${ev.data.data.message ? /* html */`<br />
                                            <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                        </div>
                                    `);

                                    break;
                                default:
                                    Game.notify("/images/roncliHype-56.png", "/media/redemption.ogg", /* html */`
                                        <div>
                                            <span class="header">${window.Common.htmlEncode(ev.data.data.name)}</span>
                                            <span class="text">has spent</span>
                                            <span class="header">${Game.cost(ev.data.data.cost)}</span>
                                            <span class="text">for</span>
                                            <span class="header">${ev.data.data.reward}!</span>${ev.data.data.message ? /* html */`<br />
                                            <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                        </div>
                                    `);

                                    break;
                            }
                            break;
                        case "resub":
                            if (!window.Home.data.sub) {
                                window.Home.data.sub = {};
                            }

                            window.Home.data.sub[ev.data.data.user] = {
                                name: ev.data.data.user,
                                isPrime: ev.data.data.isPrime,
                                months: ev.data.data.months,
                                streak: ev.data.data.streak,
                                tier: ev.data.data.tier
                            };

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Resub${ev.data.data.months ? ` x${ev.data.data.months}` : ""}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliGetRekt-56.png", "/media/sub.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">has ${ev.data.data.months && ev.data.data.months > 1 ? "been" : "become"} a</span>
                                    <span class="header">${Game.getTierName(ev.data.data.tier, ev.data.data.isPrime)}${ev.data.data.streak && ev.data.data.streak > 1 ? /* html */`</span>
                                    <span class="text">for</span>
                                    <span class="header">${ev.data.data.streak}</span>
                                    <span class="text">months in a row${ev.data.data.months && ev.data.data.months > 1 && ev.data.data.months > ev.data.data.streak ? /* html */`, for a total of</span>
                                    <span class="header">${ev.data.data.months}</span>
                                    <span class="text">months` : ""}` : ev.data.data.months && ev.data.data.months > 1 ? /* html */`</span>
                                    <span class="text">for</span>
                                    <span class="header">${ev.data.data.months}</span>
                                    <span class="text">months` : ""}!</span>${ev.data.data.message ? /* html */`<br />
                                    <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                </div>
                            `);

                            break;
                        case "sub":
                            if (!window.Home.data.sub) {
                                window.Home.data.sub = {};
                            }

                            window.Home.data.sub[ev.data.data.user] = {
                                name: ev.data.data.user,
                                isPrime: ev.data.data.isPrime,
                                months: ev.data.data.months,
                                streak: ev.data.data.streak,
                                tier: ev.data.data.tier
                            };

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Sub${ev.data.data.months ? ` x${ev.data.data.months}` : ""}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliGetRekt-56.png", "/media/sub.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">has ${ev.data.data.months && ev.data.data.months > 1 ? "been" : "become"} a</span>
                                    <span class="header">${Game.getTierName(ev.data.data.tier, ev.data.data.isPrime)}${ev.data.data.streak && ev.data.data.streak > 1 ? /* html */`</span>
                                    <span class="text">for</span>
                                    <span class="header">${ev.data.data.streak}</span>
                                    <span class="text">months in a row${ev.data.data.months && ev.data.data.months > 1 && ev.data.data.months > ev.data.data.streak ? /* html */`, for a total of</span>
                                    <span class="header">${ev.data.data.months}</span>
                                    <span class="text">months` : ""}` : ev.data.data.months && ev.data.data.months > 1 ? /* html */`</span>
                                    <span class="text">for</span>
                                    <span class="header">${ev.data.data.months}</span>
                                    <span class="text">months` : ""}!</span>${ev.data.data.message ? /* html */`<br />
                                    <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                </div>
                            `);

                            break;
                        case "subExtend":
                            if (!window.Home.data.sub) {
                                window.Home.data.sub = {};
                            }

                            window.Home.data.sub[ev.data.data.user] = {
                                name: ev.data.data.user,
                                isPrime: false,
                                months: ev.data.data.months,
                                streak: void 0,
                                tier: ev.data.data.tier
                            };

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Sub${ev.data.data.months ? ` x${ev.data.data.months}` : ""}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliGetRekt-56.png", "/media/sub.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">has ${ev.data.data.months && ev.data.data.months > 1 ? "been" : "become"} a</span>
                                    <span class="header">${Game.getTierName(ev.data.data.tier, ev.data.data.isPrime)}${ev.data.data.months && ev.data.data.months > 1 ? /* html */`</span>
                                    <span class="text">for</span>
                                    <span class="header">${ev.data.data.months}</span>
                                    <span class="text">months` : ""}!</span>
                                </div>
                            `);

                            break;
                        case "subGift":
                            if (!window.Home.data.subGift) {
                                window.Home.data.subGift = {};
                            }

                            {
                                const subGift = window.Home.data.subGift;

                                if (!subGift[ev.data.data.gifter]) {
                                    subGift[ev.data.data.gifter] = {
                                        gifts: [],
                                        total: void 0
                                    };
                                }

                                const user = subGift[ev.data.data.gifter];

                                user.total = ev.data.data.totalGiftCount || user.total;

                                user.gifts.push({
                                    name: ev.data.data.gifter,
                                    recipient: ev.data.data.user,
                                    isPrime: ev.data.data.isPrime,
                                    months: ev.data.data.months,
                                    streak: ev.data.data.streak,
                                    tier: ev.data.data.tier
                                });
                            }

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.gifter)}</span>
                                    <span class="text">Gift Subbed</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliHype-56.png", "/media/sub-gift.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.gifter)}</span>
                                    <span class="text">has made</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">a</span>
                                    <span class="header">${Game.getTierName(ev.data.data.tier, ev.data.data.isPrime)}!</span>${ev.data.data.message ? /* html */`<br />
                                    <span class="message">${window.common.htmlEncode(ev.data.data.message)}</span>` : ""}
                                </div>
                            `);

                            break;
                        case "subGiftCommunity":
                            if (!window.Home.data.subGift) {
                                window.Home.data.subGift = {};
                            }

                            {
                                const subGift = window.Home.data.subGift;

                                if (!subGift[ev.data.data.user]) {
                                    subGift[ev.data.data.user] = {
                                        gifts: [],
                                        total: void 0
                                    };
                                }

                                const user = subGift[ev.data.data.user];

                                user.total = ev.data.data.totalGiftCount || user.total;
                            }

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Gifted Subs${ev.data.data.giftCount ? ` x${ev.data.data.giftCount}` : ""}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliHype-56.png", "/media/sub-gift.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">has created</span>
                                    <span class="header">${ev.data.data.giftCount} ${Game.getTierName(ev.data.data.tier, ev.data.data.isPrime)}${ev.data.data.giftCount === 1 ? "" : "s"}${ev.data.data.totalGiftCount ? /* html */`</span>
                                    <span class="text">for a total of</span>
                                    <span class="header">${format(ev.data.data.totalGiftCount)}` : ""}!</span>
                                </div>
                            `);

                            break;
                        case "subGiftCommunityPayForward":
                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Paid Forward Gift Sub from</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.originalGifter)}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliHype-56.png", "/media/sub-gift.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">is seeking out another</span>
                                    <span class="header">Demolitionist</span>
                                    <span class="text">for</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.originalGifter || "Anonymous")}!</span>
                                </div>
                            `);

                            break;
                        case "subGiftPayForward":
                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Paid Forward Gifted Sub from</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.originalGifter)}</span>
                                    <span class="text">to</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.recipient)}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliHype-56.png", "/media/sub-gift.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">has made</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.recipient)}</span>
                                    <span class="text">a</span>
                                    <span class="header">Demolitionist</span>
                                    <span class="text">for</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.originalGifter)}!</span>
                                </div>
                            `);

                            break;
                        case "subGiftUpgrade":
                            if (!window.Home.data.sub) {
                                window.Home.data.sub = {};
                            }

                            window.Home.data.sub[ev.data.data.user] = {
                                name: ev.data.data.user,
                                isPrime: false,
                                months: void 0,
                                streak: void 0,
                                tier: ev.data.data.tier
                            };

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Continued Gift Sub from</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.gifter)}</span>
                                </div>
                            `);

                            Game.notify("/images/roncliGetRekt-56.png", "/media/sub.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">has chosen to remain a</span>
                                    <span class="header">${Game.getTierName(ev.data.data.tier)}</span>
                                    <span class="text">for</span>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.gifter)}!</span>
                                </div>
                            `);

                            break;
                        case "subPrimeUpgraded":
                            if (!window.Home.data.sub) {
                                window.Home.data.sub = {};
                            }

                            window.Home.data.sub[ev.data.data.user] = {
                                name: ev.data.data.user,
                                isPrime: false,
                                months: void 0,
                                streak: void 0,
                                tier: ev.data.data.tier
                            };

                            window.Home.data.recent.push(/* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">Upgraded from Prime Sub</span>
                                </div>
                            `);

                            Game.notify("/images/roncliGetRekt-56.png", "/media/sub.ogg", /* html */`
                                <div>
                                    <span class="header">${window.Common.htmlEncode(ev.data.data.user)}</span>
                                    <span class="text">is now a full</span>
                                    <span class="header">${Game.getTierName(ev.data.data.tier)}!</span>
                                </div>
                            `);

                            break;
                    }
                    break;
            }
        };
    }
}

/** @type {NodeJS.Timeout} */
Game.notifyTimeout = void 0;

window.Game = Game;
