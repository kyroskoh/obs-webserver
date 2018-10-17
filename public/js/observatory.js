/* global config, OBSWebSocket, Spotify */

//   ###   #                                          #
//  #   #  #                                          #
//  #   #  # ##    ###    ###   # ##   #   #   ###   ####    ###   # ##   #   #
//  #   #  ##  #  #      #   #  ##  #  #   #      #   #     #   #  ##  #  #   #
//  #   #  #   #   ###   #####  #       # #    ####   #     #   #  #      #  ##
//  #   #  ##  #      #  #      #       # #   #   #   #  #  #   #  #       ## #
//   ###   # ##   ####    ###   #        #     ####    ##    ###   #          #
//                                                                        #   #
//                                                                         ###
/**
 * A class of static functions that supports the Observatory page.
 */
class Observatory {
    //                      #  #                       ##
    //                      #  #                        #
    // ###    ##    ###   ###  #      ##    ##    ###   #
    // #  #  # ##  #  #  #  #  #     #  #  #     #  #   #
    // #     ##    # ##  #  #  #     #  #  #     # ##   #
    // #      ##    # #   ###  ####   ##    ##    # #  ###
    /**
     * Reads a local file.
     * @param {string} path The path of the file.
     * @param {boolean} base64 Whether to retrieve its Base64 representation.
     * @returns {Promise<string>} A promise that resolves with the contents of the file.
     */
    static readLocal(path, base64) {
        return new Promise((resolve, reject) => {
            const x = new XMLHttpRequest();

            x.onreadystatechange = () => {
                if (x.readyState !== 4) {
                    return;
                }

                if (x.readyState === 4 && x.status === 200) {
                    resolve(x.responseText);
                } else {
                    reject(new Error());
                }
            };
            x.open("GET", `api/local?${base64 ? "base64=true&" : ""}file=${encodeURIComponent(path)}`, true);
            x.send();
        });
    }

    //                #         #          ###    #
    //                #         #          #  #
    // #  #  ###    ###   ###  ###    ##   #  #  ##    # #
    // #  #  #  #  #  #  #  #   #    # ##  #  #   #    # #
    // #  #  #  #  #  #  # ##   #    ##    #  #   #    # #
    //  ###  ###    ###   # #    ##   ##   ###   ###    #
    //       #
    /**
     * Updates the specified div element with the text from a local path at a specified interval.
     * @param {string} element The element to update.
     * @param {string} path The local path to get the text.
     * @param {number} interval The interval in milliseconds to update the text.
     * @param {boolean} isHtml Whether this is HTML coming in.
     * @returns {Promise} A promise that resolves when the div element is updated.
     */
    static async updateDiv(element, path, interval, isHtml) {
        try {
            const responseText = await Observatory.readLocal(path, false);

            if (isHtml) {
                document.querySelector(element).innerHTML = responseText;
            } else {
                document.querySelector(element).innerText = responseText;
            }
        } finally {
            setTimeout(() => {
                Observatory.updateDiv(element, path, interval, isHtml);
            }, interval);
        }
    }

    //                #         #           ##                #     #      #
    //                #         #          #  #               #           # #
    // #  #  ###    ###   ###  ###    ##    #    ###    ##   ###   ##     #    #  #
    // #  #  #  #  #  #  #  #   #    # ##    #   #  #  #  #   #     #    ###   #  #
    // #  #  #  #  #  #  # ##   #    ##    #  #  #  #  #  #   #     #     #     # #
    //  ###  ###    ###   # #    ##   ##    ##   ###    ##     ##  ###    #      #
    //       #                                   #                              #
    /**
     * Updates the specified div and image elements with information from Spotify at the specified interval.
     * @param {[string]} elements The text element to update with the song title.
     * @param {number} interval The interval in milliseconds to update the information.
     * @returns {Promise} A promise that resolves when Spotify is updated.
     */
    static async updateSpotify(elements, interval) {
        let thisInterval;

        try {
            const response = await Spotify.readSpotify();

            if (response.playing) {
                elements.forEach((el) => {
                    document.querySelector(el).innerText = `Now Playing:\n${response.artist}\n${response.title}`;
                });
                thisInterval = Math.min(1000 + response.duration - response.progress || interval, interval);
            } else {
                elements.forEach((el) => {
                    document.querySelector(el).innerText = "";
                });
                thisInterval = void 0;
            }
        } finally {
            setTimeout(() => {
                Observatory.updateSpotify(elements, interval);
            }, thisInterval || interval);
        }
    }

    //                #         #          #  #   #       #
    //                #         #          #  #           #
    // #  #  ###    ###   ###  ###    ##   #  #  ##     ###   ##    ##
    // #  #  #  #  #  #  #  #   #    # ##  #  #   #    #  #  # ##  #  #
    // #  #  #  #  #  #  # ##   #    ##     ##    #    #  #  ##    #  #
    //  ###  ###    ###   # #    ##   ##    ##   ###    ###   ##    ##
    //       #
    /**
     * Updates the specified video element with the web cam feed.
     * @param {string} element The element to update.
     * @returns {Promise} A promise that returns when the video element is updated.
     */
    static async updateVideo(element) {
        const video = document.querySelector(element),
            devices = await navigator.mediaDevices.enumerateDevices(),
            {deviceId} = devices.filter((d) => d.kind === "videoinput" && d.label.startsWith("Logitech HD Pro Webcam C920"))[0];

        navigator.webkitGetUserMedia({
            video: {
                mandatory: {
                    minWidth: 1920,
                    minHeight: 1080
                },
                optional: [{sourceId: deviceId}]
            }
        }, (stream) => {
            video.srcObject = stream;
        }, (err) => {
            console.log(err);
        });
    }

    //         #           #            ##    #                 #
    //         #           #           #  #   #                 #
    //  ###   ###    ###  ###    ###    #    ###    ###  ###   ###
    // ##      #    #  #   #    ##       #    #    #  #  #  #   #
    //   ##    #    # ##   #      ##   #  #   #    # ##  #      #
    // ###      ##   # #    ##  ###     ##     ##   # #  #       ##
    /**
     * Starts the stats carousel.
     * @returns {Promise} A promise that resolves when the stats carousel is started.
     */
    static async statsStart() {
        try {
            await new Promise((resolve) => {
                const x = new XMLHttpRequest();
                x.onreadystatechange = function() {
                    if (x.readyState === 4 && x.status === 200) {
                        Observatory.events = JSON.parse(x.responseText);
                        resolve();
                    }
                };
                x.open("GET", "api/observatoryEvents", true);
                x.send();
            });

            await new Promise((resolve) => {
                const x = new XMLHttpRequest();
                x.onreadystatechange = function() {
                    if (x.readyState === 4 && x.status === 200) {
                        Observatory.stats = JSON.parse(x.responseText);
                        Observatory.stats.sort((a, b) => {
                            if (a.championshipSeasons - b.championshipSeasons !== 0) {
                                return b.championshipSeasons - a.championshipSeasons;
                            }

                            if (a.runnerUpSeasons - b.runnerUpSeasons !== 0) {
                                return b.runnerUpSeasons - a.runnerUpSeasons;
                            }

                            if (a.games - b.games !== 0) {
                                return b.games - a.games;
                            }

                            return b.rating - a.rating;
                        }).splice(30);
                        Observatory.stats.sort((a, b) => {
                            if (a.championshipSeasons - b.championshipSeasons !== 0) {
                                return b.championshipSeasons - a.championshipSeasons;
                            }

                            if (a.runnerUpSeasons - b.runnerUpSeasons !== 0) {
                                return b.runnerUpSeasons - a.runnerUpSeasons;
                            }

                            return b.rating - a.rating;
                        });
                        resolve();
                    }
                };
                x.open("GET", "api/observatoryStats", true);
                x.send();
            });

            Observatory.lastEvent = Observatory.events[Observatory.events.length - 1];
            Observatory.seasons = Observatory.seasons || {};

            await new Promise((resolve) => {
                const x = new XMLHttpRequest();
                x.onreadystatechange = function() {
                    if (x.readyState === 4 && x.status === 200) {
                        Observatory.seasons[Observatory.lastEvent.season] = JSON.parse(x.responseText);
                        resolve();
                    }
                };
                x.open("GET", `api/observatorySeason?season=${Observatory.events[Observatory.events.length - 1].season}`, true);
                x.send();
            });

            Observatory.delay = 30000;
            Observatory.status = 0;
            Observatory.season = 0;
            Observatory.event = 0;

            Observatory.statsNext();
        } catch (ex) {
            Observatory.carouselTimeout = setTimeout(Observatory.statsStart, Observatory.delay);
        }
    }

    //         #           #           #  #               #     ##                           ##    ##
    //         #           #           ## #               #    #  #                           #     #
    //  ###   ###    ###  ###    ###   ## #   ##   #  #  ###   #  #  # #    ##   ###    ###   #     #
    // ##      #    #  #   #    ##     # ##  # ##   ##    #    #  #  # #   # ##  #  #  #  #   #     #
    //   ##    #    # ##   #      ##   # ##  ##     ##    #    #  #  # #   ##    #     # ##   #     #
    // ###      ##   # #    ##  ###    #  #   ##   #  #    ##   ##    #     ##   #      # #  ###   ###
    /**
     * Shows the overall stats.
     * @returns {void}
     */
    static statsNextOverall() {
        const $thead = document.querySelector("#stats thead"),
            $tbody = document.querySelector("#stats tbody");

        while ($thead.firstChild) {
            $thead.removeChild($thead.firstChild);
        }

        let node;

        node = document.createElement("td");
        node.innerText = "Pilot";
        $thead.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Rating";
        node.classList.add("center");
        $thead.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Overall";
        node.classList.add("center");
        $thead.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Qualifiers";
        node.classList.add("center");
        $thead.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Finals Tournament";
        node.classList.add("center");
        $thead.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Championship Seasons";
        node.classList.add("center");
        $thead.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Runner Up Seasons";
        node.classList.add("center");
        $thead.appendChild(node);

        while ($tbody.firstChild) {
            $tbody.removeChild($tbody.firstChild);
        }

        Observatory.stats.forEach((stat) => {
            const row = document.createElement("tr");
            row.style.borderTop = "solid 1px rgba(128, 128, 128, 0.5)";

            node = document.createElement("td");
            node.innerText = stat.name;
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = Math.round(stat.rating);
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = `${stat.wins}-${stat.losses}`;
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = `${stat.qualifierWins}-${stat.qualifierLosses}`;
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = `${stat.finalsTournamentWins}-${stat.finalsTournamentLosses}`;
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = stat.championshipSeasons;
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = stat.runnerUpSeasons;
            node.classList.add("center");
            row.appendChild(node);

            $tbody.appendChild(row);
        });

        Observatory.status = 1;
        Observatory.season++;
        if (!Observatory.events.find((ev) => ev.season === Observatory.season)) {
            Observatory.season = 1;
        }
        Observatory.event = 1;

        Observatory.carouselTimeout = setTimeout(Observatory.statsNext, Observatory.delay);
    }

    //         #           #           #  #               #     ##    #                   #   #
    //         #           #           ## #               #    #  #   #                   #
    //  ###   ###    ###  ###    ###   ## #   ##   #  #  ###    #    ###    ###  ###    ###  ##    ###    ###   ###
    // ##      #    #  #   #    ##     # ##  # ##   ##    #      #    #    #  #  #  #  #  #   #    #  #  #  #  ##
    //   ##    #    # ##   #      ##   # ##  ##     ##    #    #  #   #    # ##  #  #  #  #   #    #  #   ##     ##
    // ###      ##   # #    ##  ###    #  #   ##   #  #    ##   ##     ##   # #  #  #   ###  ###   #  #  #     ###
    //                                                                                                    ###
    /**
     * Shows standings from a season.
     * @returns {void}
     */
    static async statsNextStandings() {
        if (!Observatory.seasons[Observatory.season]) {
            try {
                await new Promise((resolve) => {
                    const x = new XMLHttpRequest();
                    x.onreadystatechange = function() {
                        if (x.readyState === 4 && x.status === 200) {
                            Observatory.seasons[Observatory.season] = JSON.parse(x.responseText);
                            resolve();
                        }
                    };
                    x.open("GET", `api/observatorySeason?season=${Observatory.season}`, true);
                    x.send();
                });
            } catch (ex) {
                Observatory.carouselTimeout = setTimeout(Observatory.statsNext, Observatory.delay);
                return;
            }
        }

        Observatory.showEvent(Observatory.events.filter((ev) => ev.season === Observatory.season)[Observatory.event - 1]);

        Observatory.event++;

        if (Observatory.event > Observatory.events.filter((ev) => ev.season === Observatory.season).length) {
            if (Observatory.seasons[Observatory.lastEvent.season].finals) {
                Observatory.status = 0;
            } else {
                Observatory.status = 2;
            }
        }

        Observatory.carouselTimeout = setTimeout(Observatory.statsNext, Observatory.delay);
    }

    //        #                 ####                     #
    //        #                 #                        #
    //  ###   ###    ##   #  #  ###   # #    ##   ###   ###
    // ##     #  #  #  #  #  #  #     # #   # ##  #  #   #
    //   ##   #  #  #  #  ####  #     # #   ##    #  #   #
    // ###    #  #   ##   ####  ####   #     ##   #  #    ##
    /**
     * Shows the event.
     * @param {object} event The event to show.
     * @returns {void}
     */
    static showEvent(event) {
        const $thead = document.querySelector("#stats thead"),
            $tbody = document.querySelector("#stats tbody");

        while ($thead.firstChild) {
            $thead.removeChild($thead.firstChild);
        }

        while ($tbody.firstChild) {
            $tbody.removeChild($tbody.firstChild);
        }

        if (event.event.indexOf("Qualifier") === -1) {
            let row, node, div, innerNode, innerTable;

            row = document.createElement("tr");

            node = document.createElement("td");
            node.colSpan = 2;
            div = document.createElement("div");
            div.innerText = `Season ${Observatory.season} Results`;
            div.classList.add("obs-box");
            div.classList.add("no-margin");
            node.appendChild(div);
            row.appendChild(node);

            $tbody.appendChild(row);

            row = document.createElement("tr");

            node = document.createElement("td");
            node.colSpan = 2;
            node.innerText = `Finals Tournament - ${new Date(event.date).toLocaleDateString("en-us", {timeZone: "America/Los_Angeles", weekday: "long", year: "numeric", month: "long", day: "numeric", hour12: true, hour: "2-digit", minute: "2-digit", timeZoneName: "short"})}`;
            node.classList.add("center");
            row.appendChild(node);

            $tbody.appendChild(row);

            const innerRow = document.createElement("tr");

            innerNode = document.createElement("td");
            innerTable = document.createElement("table");

            row = document.createElement("tr");

            node = document.createElement("td");
            node.colSpan = 6;
            div = document.createElement("div");
            div.innerText = "Standings";
            div.classList.add("obs-box");
            node.appendChild(div);
            row.appendChild(node);

            innerTable.appendChild(row);

            row = document.createElement("tr");

            node = document.createElement("td");
            node.innerText = "Pos";
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = "Pilot";
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = "Week 1";
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = "Week 2";
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = "Week 3";
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = "Points";
            node.classList.add("center");
            row.appendChild(node);

            innerTable.appendChild(row);

            Observatory.seasons[Observatory.season].standings.forEach((pilot, index) => {
                row = document.createElement("tr");

                node = document.createElement("td");
                node.innerText = index + 1;
                node.classList.add("center");
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = pilot.name;
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = `${pilot.qualifiers[1] ? `${pilot.qualifiers[1].points} (${pilot.qualifiers[1].wins}-${pilot.qualifiers[1].losses})` : "-"}`;
                node.classList.add("center");
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = `${pilot.qualifiers[2] ? `${pilot.qualifiers[2].points} (${pilot.qualifiers[2].wins}-${pilot.qualifiers[2].losses})` : "-"}`;
                node.classList.add("center");
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = `${pilot.qualifiers[3] ? `${pilot.qualifiers[3].points} (${pilot.qualifiers[3].wins}-${pilot.qualifiers[3].losses})` : "-"}`;
                node.classList.add("center");
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = pilot.points;
                node.classList.add("center");
                row.appendChild(node);

                innerTable.appendChild(row);
            });

            innerNode.appendChild(innerTable);
            innerRow.appendChild(innerNode);

            innerNode = document.createElement("td");
            innerTable = document.createElement("table");
            innerTable.classList.add("fixed");

            row = document.createElement("tr");

            node = document.createElement("td");
            node.colSpan = Object.keys(Observatory.seasons[Observatory.season].finals).length;
            div = document.createElement("div");
            div.innerText = "Tournament";
            div.classList.add("obs-box");
            node.appendChild(div);
            row.appendChild(node);

            innerTable.appendChild(row);

            row = document.createElement("tr");

            Object.keys(Observatory.seasons[Observatory.season].finals).forEach((round) => {
                node = document.createElement("td");

                Observatory.seasons[Observatory.season].finals[round].forEach((match) => {
                    let scoreNode, scoreRow;

                    const matchTable = document.createElement("table");

                    match.score.forEach((score) => {
                        scoreRow = document.createElement("tr");
                        scoreRow.classList.add("score");

                        scoreNode = document.createElement("td");
                        scoreNode.innerText = `${score.seed}) ${score.name}`;
                        scoreRow.appendChild(scoreNode);

                        scoreNode = document.createElement("td");
                        scoreNode.innerText = score.score;
                        scoreNode.classList.add("right");
                        scoreNode.style.width = "1px";
                        scoreRow.appendChild(scoreNode);

                        matchTable.appendChild(scoreRow);
                    });

                    scoreRow = document.createElement("tr");

                    scoreNode = document.createElement("td");
                    scoreNode.innerText = match.map;
                    scoreNode.colSpan = 2;
                    scoreRow.appendChild(scoreNode);

                    matchTable.appendChild(scoreRow);

                    node.appendChild(matchTable);
                });

                row.appendChild(node);
            });

            innerTable.appendChild(row);

            innerNode.appendChild(innerTable);
            innerRow.appendChild(innerNode);

            $tbody.append(innerRow);
        } else {
            let row, node, div, innerNode, innerTable;

            row = document.createElement("tr");

            node = document.createElement("td");
            node.colSpan = 2;
            div = document.createElement("div");
            div.innerText = `Season ${Observatory.season} Results`;
            div.classList.add("obs-box");
            div.classList.add("no-margin");
            node.appendChild(div);
            row.appendChild(node);

            $tbody.appendChild(row);

            row = document.createElement("tr");

            node = document.createElement("td");
            node.colSpan = 2;
            node.innerText = `Qualifier ${Observatory.event} - ${new Date(event.date).toLocaleDateString("en-us", {timeZone: "America/Los_Angeles", weekday: "long", year: "numeric", month: "long", day: "numeric", hour12: true, hour: "2-digit", minute: "2-digit", timeZoneName: "short"})}`;
            node.classList.add("center");
            row.appendChild(node);

            $tbody.appendChild(row);

            const innerRow = document.createElement("tr");

            Object.keys(Observatory.seasons[Observatory.season].qualifier[Observatory.event]).forEach((round) => {
                if (round % 2 === 1) {
                    innerNode = document.createElement("td");
                    innerTable = document.createElement("table");
                    innerNode.appendChild(innerTable);
                    innerRow.appendChild(innerNode);
                }

                row = document.createElement("tr");

                node = document.createElement("td");
                node.colSpan = 5;
                div = document.createElement("div");
                div.innerText = `Round ${round}`;
                div.classList.add("obs-box");
                node.appendChild(div);
                row.appendChild(node);

                innerTable.appendChild(row);

                Observatory.seasons[Observatory.season].qualifier[Observatory.event][round].forEach((match) => {
                    row = document.createElement("tr");

                    node = document.createElement("td");
                    node.innerText = match.score[0].name;
                    row.appendChild(node);

                    node = document.createElement("td");
                    node.innerText = match.score[0].score;
                    node.classList.add("right");
                    row.appendChild(node);

                    node = document.createElement("td");
                    node.innerText = match.score[1].name;
                    row.appendChild(node);

                    node = document.createElement("td");
                    node.innerText = match.score[1].score;
                    node.classList.add("right");
                    row.appendChild(node);

                    node = document.createElement("td");
                    node.innerText = match.map;
                    row.appendChild(node);

                    innerTable.appendChild(row);
                });
            });

            $tbody.appendChild(innerRow);
        }
    }

    //        #                  ##                                   ##    #                   #   #
    //        #                 #  #                                 #  #   #                   #
    //  ###   ###    ##   #  #   #     ##    ###   ###    ##   ###    #    ###    ###  ###    ###  ##    ###    ###   ###
    // ##     #  #  #  #  #  #    #   # ##  #  #  ##     #  #  #  #    #    #    #  #  #  #  #  #   #    #  #  #  #  ##
    //   ##   #  #  #  #  ####  #  #  ##    # ##    ##   #  #  #  #  #  #   #    # ##  #  #  #  #   #    #  #   ##     ##
    // ###    #  #   ##   ####   ##    ##    # #  ###     ##   #  #   ##     ##   # #  #  #   ###  ###   #  #  #     ###
    //                                                                                                          ###
    /**
     * Shows the standings for a given season.
     * @param {number} season The season to show the standings for.
     * @returns {void}
     */
    static showSeasonStandings(season) {
        const $thead = document.querySelector("#stats thead"),
            $tbody = document.querySelector("#stats tbody");

        while ($thead.firstChild) {
            $thead.removeChild($thead.firstChild);
        }

        while ($tbody.firstChild) {
            $tbody.removeChild($tbody.firstChild);
        }

        let row, node;

        row = document.createElement("tr");

        node = document.createElement("td");
        node.colSpan = 6;

        const div = document.createElement("div");

        div.innerText = `Season ${season} Standings`;
        div.classList.add("obs-box");
        div.classList.add("no-margin");
        node.appendChild(div);
        row.appendChild(node);

        $tbody.appendChild(row);

        row = document.createElement("tr");

        node = document.createElement("td");
        node.innerText = "Pos";
        node.classList.add("center");
        row.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Pilot";
        row.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Week 1";
        node.classList.add("center");
        row.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Week 2";
        node.classList.add("center");
        row.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Week 3";
        node.classList.add("center");
        row.appendChild(node);

        node = document.createElement("td");
        node.innerText = "Points";
        node.classList.add("center");
        row.appendChild(node);

        $tbody.appendChild(row);

        Observatory.seasons[season].standings.forEach((pilot, index) => {
            row = document.createElement("tr");

            node = document.createElement("td");
            node.innerText = index + 1;
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = pilot.name;
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = `${pilot.qualifiers[1] ? `${pilot.qualifiers[1].points} (${pilot.qualifiers[1].wins}-${pilot.qualifiers[1].losses})` : "-"}`;
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = `${pilot.qualifiers[2] ? `${pilot.qualifiers[2].points} (${pilot.qualifiers[2].wins}-${pilot.qualifiers[2].losses})` : "-"}`;
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = `${pilot.qualifiers[3] ? `${pilot.qualifiers[3].points} (${pilot.qualifiers[3].wins}-${pilot.qualifiers[3].losses})` : "-"}`;
            node.classList.add("center");
            row.appendChild(node);

            node = document.createElement("td");
            node.innerText = pilot.points;
            node.classList.add("center");
            row.appendChild(node);

            $tbody.appendChild(row);
        });
    }

    //         #           #           #  #               #     ##                                  #     ##
    //         #           #           ## #               #    #  #                                 #    #  #
    //  ###   ###    ###  ###    ###   ## #   ##   #  #  ###   #     #  #  ###   ###    ##   ###   ###    #     ##    ###   ###    ##   ###
    // ##      #    #  #   #    ##     # ##  # ##   ##    #    #     #  #  #  #  #  #  # ##  #  #   #      #   # ##  #  #  ##     #  #  #  #
    //   ##    #    # ##   #      ##   # ##  ##     ##    #    #  #  #  #  #     #     ##    #  #   #    #  #  ##    # ##    ##   #  #  #  #
    // ###      ##   # #    ##  ###    #  #   ##   #  #    ##   ##    ###  #     #      ##   #  #    ##   ##    ##    # #  ###     ##   #  #
    /**
     * Displays the current season standings.
     * @returns {void}
     */
    static statsNextCurrentSeason() {
        Observatory.showSeasonStandings(Observatory.lastEvent.season);

        Observatory.status = 0;

        Observatory.carouselTimeout = setTimeout(Observatory.statsNext, Observatory.delay);
    }

    //         #           #           #  #               #
    //         #           #           ## #               #
    //  ###   ###    ###  ###    ###   ## #   ##   #  #  ###
    // ##      #    #  #   #    ##     # ##  # ##   ##    #
    //   ##    #    # ##   #      ##   # ##  ##     ##    #
    // ###      ##   # #    ##  ###    #  #   ##   #  #    ##
    /**
     * Displays the next page.
     * @returns {void}
     */
    static statsNext() {
        switch (Observatory.status) {
            case 0:
                Observatory.statsNextOverall();
                break;
            case 1:
                Observatory.statsNextStandings();
                break;
            case 2:
                Observatory.statsNextCurrentSeason();
                break;
        }
    }

    //                                ##    #                 #
    //                               #  #   #                 #
    // ###    ##    ##    ###  ###    #    ###    ###  ###   ###
    // #  #  # ##  #     #  #  #  #    #    #    #  #  #  #   #
    // #     ##    #     # ##  #  #  #  #   #    # ##  #      #
    // #      ##    ##    # #  ###    ##     ##   # #  #       ##
    //                         #
    /**
     * Starts the recap carousel.
     * @returns {Promise} A promise that resolves when the carousel has started.
     */
    static async recapStart() {
        try {
            await new Promise((resolve) => {
                const x = new XMLHttpRequest();
                x.onreadystatechange = function() {
                    if (x.readyState === 4 && x.status === 200) {
                        Observatory.events = JSON.parse(x.responseText);
                        resolve();
                    }
                };
                x.open("GET", "api/observatoryEvents", true);
                x.send();
            });

            Observatory.lastEvent = Observatory.events[Observatory.events.length - 1];
            Observatory.season = Observatory.lastEvent.season;
            Observatory.event = Observatory.events.filter((event) => event.season === Observatory.season).length;
            Observatory.seasons = Observatory.seasons || {};

            await new Promise((resolve) => {
                const x = new XMLHttpRequest();
                x.onreadystatechange = function() {
                    if (x.readyState === 4 && x.status === 200) {
                        Observatory.seasons[Observatory.season] = JSON.parse(x.responseText);
                        resolve();
                    }
                };
                x.open("GET", `api/observatorySeason?season=${Observatory.season}`, true);
                x.send();
            });

            Observatory.delay = 30000;
            Observatory.status = 0;

            Observatory.recapNext();
        } catch (ex) {
            Observatory.carouselTimeout = setTimeout(Observatory.recapStart, Observatory.delay);
        }
    }

    //                               #  #               #    ####                     #
    //                               ## #               #    #                        #
    // ###    ##    ##    ###  ###   ## #   ##   #  #  ###   ###   # #    ##   ###   ###
    // #  #  # ##  #     #  #  #  #  # ##  # ##   ##    #    #     # #   # ##  #  #   #
    // #     ##    #     # ##  #  #  # ##  ##     ##    #    #     # #   ##    #  #   #
    // #      ##    ##    # #  ###   #  #   ##   #  #    ##  ####   #     ##   #  #    ##
    //                         #
    /**
     * Recaps the event.
     * @returns {void}
     */
    static recapNextEvent() {
        Observatory.showEvent(Observatory.lastEvent);

        if (Observatory.lastEvent.event.indexOf("Qualifier") !== -1) {
            Observatory.status = 1;
            Observatory.carouselTimeout = setTimeout(Observatory.recapNext, Observatory.delay);
        }
    }

    //                               #  #               #     ##    #                   #   #
    //                               ## #               #    #  #   #                   #
    // ###    ##    ##    ###  ###   ## #   ##   #  #  ###    #    ###    ###  ###    ###  ##    ###    ###   ###
    // #  #  # ##  #     #  #  #  #  # ##  # ##   ##    #      #    #    #  #  #  #  #  #   #    #  #  #  #  ##
    // #     ##    #     # ##  #  #  # ##  ##     ##    #    #  #   #    # ##  #  #  #  #   #    #  #   ##     ##
    // #      ##    ##    # #  ###   #  #   ##   #  #    ##   ##     ##   # #  #  #   ###  ###   #  #  #     ###
    //                         #                                                                        ###
    /**
     * Recaps the standings.
     * @returns {void}
     */
    static recapNextStandings() {
        Observatory.showSeasonStandings(Observatory.season);

        Observatory.status = 0;
        Observatory.carouselTimeout = setTimeout(Observatory.recapNext, Observatory.delay);
    }

    //                               #  #               #
    //                               ## #               #
    // ###    ##    ##    ###  ###   ## #   ##   #  #  ###
    // #  #  # ##  #     #  #  #  #  # ##  # ##   ##    #
    // #     ##    #     # ##  #  #  # ##  ##     ##    #
    // #      ##    ##    # #  ###   #  #   ##   #  #    ##
    //                         #
    /**
     * Displays the next page.
     * @returns {void}
     */
    static recapNext() {
        switch (Observatory.status) {
            case 0:
                Observatory.recapNextEvent();
                break;
            case 1:
                Observatory.recapNextStandings();
                break;
        }
    }

    //        #                 #  #         #          #
    //        #                 ####         #          #
    //  ###   ###    ##   #  #  ####   ###  ###    ##   ###    ##    ###
    // ##     #  #  #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    //   ##   #  #  #  #  ####  #  #  # ##   #    #     #  #  ##      ##
    // ###    #  #   ##   ####  #  #   # #    ##   ##   #  #   ##   ###
    /**
     * Shows the matches for the current round.
     * @param {number} round The round number to show matches for.
     * @returns {void}
     */
    static showMatches(round) {
        document.getElementById("text").innerText = `Round ${round}`;

        const tbody = document.querySelector("#data table tbody");

        tbody.innerHTML = "";

        if (Observatory.matches) {
            Observatory.matches.filter((m) => m.round === round).forEach((match) => {
                const row = document.createElement("tr");
                let node;

                node = document.createElement("td");
                if (match.player1 === match.winner) {
                    node.classList.add("winner");
                } else if (match.player2 === match.winner) {
                    node.classList.add("loser");
                }
                node.innerText = match.player1;
                row.appendChild(node);

                node = document.createElement("td");
                if (match.player2 === match.winner) {
                    node.classList.add("winner");
                } else if (match.player1 === match.winner) {
                    node.classList.add("loser");
                }
                node.innerText = match.player2;
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = match.score1 ? `${match.score1}-${match.score2}` : "";
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = (match.homes ? match.homes.join(", ") : match.home) || "";
                row.appendChild(node);

                tbody.appendChild(row);
            });
        }
    }

    //        #                  ##    #                   #   #
    //        #                 #  #   #                   #
    //  ###   ###    ##   #  #   #    ###    ###  ###    ###  ##    ###    ###   ###
    // ##     #  #  #  #  #  #    #    #    #  #  #  #  #  #   #    #  #  #  #  ##
    //   ##   #  #  #  #  ####  #  #   #    # ##  #  #  #  #   #    #  #   ##     ##
    // ###    #  #   ##   ####   ##     ##   # #  #  #   ###  ###   #  #  #     ###
    //                                                                     ###
    /**
     * Shows the current standings.
     * @returns {void}
     */
    static showStandings() {
        document.getElementById("text").innerText = "Standings";

        const tbody = document.querySelector("#data table tbody");

        tbody.innerHTML = "";

        if (Observatory.standings) {
            Observatory.standings.forEach((standing) => {
                const row = document.createElement("tr");
                let node;

                if (standing.player.withdrawn) {
                    row.classList.add("withdrawn");
                } else if (!standing.player.canHost) {
                    row.classList.add("unable-to-host");
                }

                node = document.createElement("td");
                node.innerText = standing.name;
                row.appendChild(node);

                node = document.createElement("td");
                node.classList.add("right");
                node.innerText = `${standing.score}`;
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = `${standing.wins}-${standing.losses}`;
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = standing.player.homes.join(", ");
                row.appendChild(node);

                tbody.appendChild(row);
            });
        }
    }

    //                #         #          ###                        #
    //                #         #          #  #                       #
    // #  #  ###    ###   ###  ###    ##   #  #   ##   #  #  ###    ###
    // #  #  #  #  #  #  #  #   #    # ##  ###   #  #  #  #  #  #  #  #
    // #  #  #  #  #  #  # ##   #    ##    # #   #  #  #  #  #  #  #  #
    //  ###  ###    ###   # #    ##   ##   #  #   ##    ###  #  #   ###
    //       #
    /**
     * Updates the round number, and automatically switches to the current round's matches.
     * @param {number} round The current round number.
     * @returns {void}
     */
    static updateRound(round) {
        Observatory.round = round;
        Observatory.showMatches(+round);
    }

    //                #         #          #  #         #          #
    //                #         #          ####         #          #
    // #  #  ###    ###   ###  ###    ##   ####   ###  ###    ##   ###
    // #  #  #  #  #  #  #  #   #    # ##  #  #  #  #   #    #     #  #
    // #  #  #  #  #  #  # ##   #    ##    #  #  # ##   #    #     #  #
    //  ###  ###    ###   # #    ##   ##   #  #   # #    ##   ##   #  #
    //       #
    /**
     * Updates a match, or adds it if not present.
     * @param {object} match The match to update or add.
     * @returns {void}
     */
    static updateMatch(match) {
        if (!Observatory.matches) {
            Observatory.matches = [];
        }

        const existingMatch = Observatory.matches.find((m) => m.player1 === match.player1 && m.player2 === match.player2 && m.round === match.round);

        if (existingMatch) {
            existingMatch.winner = match.winner;
            existingMatch.score1 = match.score1;
            existingMatch.score2 = match.score2;
            existingMatch.home = match.home;
            existingMatch.homes = match.homes;
        } else {
            Observatory.matches.push(match);
        }

        if (document.getElementById("text").innerHTML === `Round ${match.round}`) {
            Observatory.showMatches(+match.round);
        }
    }

    //                #         #           ##    #                   #   #
    //                #         #          #  #   #                   #
    // #  #  ###    ###   ###  ###    ##    #    ###    ###  ###    ###  ##    ###    ###   ###
    // #  #  #  #  #  #  #  #   #    # ##    #    #    #  #  #  #  #  #   #    #  #  #  #  ##
    // #  #  #  #  #  #  # ##   #    ##    #  #   #    # ##  #  #  #  #   #    #  #   ##     ##
    //  ###  ###    ###   # #    ##   ##    ##     ##   # #  #  #   ###  ###   #  #  #     ###
    //       #                                                                        ###
    /**
     * Updates the standings.
     * @param {object} standings The standings
     * @returns {void}
     */
    static updateStandings(standings) {
        Observatory.standings = standings;

        if (document.getElementById("text").innerHTML === "Standings") {
            Observatory.showStandings();
        }
    }

    //         #                 #    #  #        #                        #            #
    //         #                 #    #  #        #                        #            #
    //  ###   ###    ###  ###   ###   #  #   ##   ###    ###    ##    ##   # #    ##   ###    ###
    // ##      #    #  #  #  #   #    ####  # ##  #  #  ##     #  #  #     ##    # ##   #    ##
    //   ##    #    # ##  #      #    ####  ##    #  #    ##   #  #  #     # #   ##     #      ##
    // ###      ##   # #  #       ##  #  #   ##   ###   ###     ##    ##   #  #   ##     ##  ###
    /**
     * Starts the WebSocket connections and performs updates based on the messages received.
     * @returns {void}
     */
    static startWebsockets() {
        Observatory.ws = new WebSocket(`ws://${document.location.hostname}:${document.location.port || "80"}/ws/listen`);
        Observatory.obs = new OBSWebSocket();
        Observatory.obsws = new WebSocket(config.observatoryWsUrl);

        Observatory.ws.onmessage = (ev) => {
            const data = JSON.parse(ev.data),
                bumper = document.getElementById("bumper"),
                tournament = document.getElementById("tournament");

            switch (data.type) {
                case "obs-scene":
                    Observatory.obs.setCurrentScene({"scene-name": data.scene});
                    break;
                case "scene":
                    switch (data.scene) {
                        case "obs-countdown":
                            bumper.classList.remove("hidden");
                            tournament.classList.add("hidden");

                            Observatory.setStartTime(data.time);
                            Observatory.setFinishText(data.finish);

                            if (Observatory.startTime && Observatory.startTime > new Date()) {
                                Observatory.updateCountdown();
                            }

                            document.getElementById("bumper-event").innerText = data.season;
                            document.getElementById("tournament-event").innerText = data.season;

                            document.getElementById("bumper-subevent").innerText = data.title;
                            document.getElementById("tournament-subevent").innerText = data.title;

                            Spotify.playPlaylist("spotify:user:1211227601:playlist:3ld3qI0evdqsr66HoaE0Zp", false);
                            Spotify.setSpotifyVolume(100);
                            Observatory.obs.setCurrentScene({"scene-name": "The Observatory - Bumper"});

                            if (Observatory.carouselTimeout) {
                                clearTimeout(Observatory.carouselTimeout);
                            }
                            Observatory.statsStart();

                            break;
                        case "obs-tournament":
                            bumper.classList.add("hidden");
                            tournament.classList.remove("hidden");

                            document.getElementById("bumper-event").innerText = data.season;
                            document.getElementById("tournament-event").innerText = data.season;

                            document.getElementById("bumper-subevent").innerText = data.title;
                            document.getElementById("tournament-subevent").innerText = data.title;

                            Spotify.setSpotifyVolume(33);
                            Observatory.obs.setCurrentScene({"scene-name": "The Observatory - Tournament"});

                            if (Observatory.carouselTimeout) {
                                clearTimeout(Observatory.carouselTimeout);
                            }

                            break;
                        case "obs-thanks":
                            bumper.classList.remove("hidden");
                            tournament.classList.add("hidden");

                            if (Observatory.countdownTimeout) {
                                clearTimeout(Observatory.countdownTimeout);
                                delete Observatory.countdownTimeout;
                            }
                            document.getElementById("countdown").innerText = "Thanks for watching!";

                            Spotify.setSpotifyVolume(100);
                            Observatory.obs.setCurrentScene({"scene-name": "The Observatory - Bumper"});

                            if (Observatory.carouselTimeout) {
                                clearTimeout(Observatory.carouselTimeout);
                            }
                            Observatory.recapStart();

                            break;
                    }
                    break;
                case "obs":
                    switch (data.action) {
                        case "season":
                            document.getElementById("bumper-event").innerText = data.season;
                            document.getElementById("tournament-event").innerText = data.season;
                            break;
                        case "title":
                            document.getElementById("bumper-subevent").innerText = data.title;
                            document.getElementById("tournament-subevent").innerText = data.title;
                            break;
                        case "start-time":
                            Observatory.setStartTime(data.time);
                            break;
                        case "finish-text":
                            Observatory.setFinishText(data.finish);
                            break;
                    }
                    break;
                case "display":
                    switch (data.display) {
                        case "round":
                            Observatory.showMatches(+data.round);
                            break;
                        case "standings":
                            Observatory.showStandings();
                            break;
                    }
                    break;
            }
        };

        Observatory.obsws.onmessage = (ev) => {
            const data = JSON.parse(ev.data);

            if (data.round) {
                Observatory.updateRound(data.round);
            }

            if (data.match) {
                Observatory.updateMatch(data.match);
            }

            if (data.matches) {
                data.matches.forEach((match) => {
                    Observatory.updateMatch(match);
                });
            }

            if (data.standings) {
                Observatory.updateStandings(data.standings);
            }
        };

        Observatory.obs.connect(config.websocket);
    }

    //               #     ##    #                 #    ###    #
    //               #    #  #   #                 #     #
    //  ###    ##   ###    #    ###    ###  ###   ###    #    ##    # #    ##
    // ##     # ##   #      #    #    #  #  #  #   #     #     #    ####  # ##
    //   ##   ##     #    #  #   #    # ##  #      #     #     #    #  #  ##
    // ###     ##     ##   ##     ##   # #  #       ##   #    ###   #  #   ##
    /**
     * Sets the start time for the race.
     * @param {string} time The time to start the race.
     * @returns {void}
     */
    static setStartTime(time) {
        const now = new Date();

        Observatory.startTime = new Date(`${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${time}`);

        if (Observatory.startTime < new Date()) {
            Observatory.startTime = new Date(Observatory.startTime.getTime() + 86400000);
        }
    }

    //               #    ####   #           #           #     ###                #
    //               #    #                              #      #                 #
    //  ###    ##   ###   ###   ##    ###   ##     ###   ###    #     ##   #  #  ###
    // ##     # ##   #    #      #    #  #   #    ##     #  #   #    # ##   ##    #
    //   ##   ##     #    #      #    #  #   #      ##   #  #   #    ##     ##    #
    // ###     ##     ##  #     ###   #  #  ###   ###    #  #   #     ##   #  #    ##
    /**
     * Sets the text to display when the countdown is finished.
     * @param {string} finish The text to display when the countdown is finished.
     * @returns {void}
     */
    static setFinishText(finish) {
        Observatory.finishText = finish;

        if (!Observatory.startTime || Observatory.startTime < new Date()) {
            document.getElementById("countdown").innerText = finish;
        }
    }

    //                #         #           ##                      #       #
    //                #         #          #  #                     #       #
    // #  #  ###    ###   ###  ###    ##   #      ##   #  #  ###   ###    ###   ##   #  #  ###
    // #  #  #  #  #  #  #  #   #    # ##  #     #  #  #  #  #  #   #    #  #  #  #  #  #  #  #
    // #  #  #  #  #  #  # ##   #    ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ####  #  #
    //  ###  ###    ###   # #    ##   ##    ##    ##    ###  #  #    ##   ###   ##   ####  #  #
    //       #
    /**
     * Updates the countdown text.
     * @returns {void}
     */
    static updateCountdown() {
        const timeLeft = new Date(Observatory.startTime.getTime() - new Date().getTime()),
            countdown = document.getElementById("countdown");

        if (timeLeft.getTime() < 0) {
            countdown.innerText = Observatory.finishText;
            delete Observatory.countdownTimeout;
            return;
        }

        countdown.innerText = timeLeft.toLocaleDateString("en-us", {timeZone: "UTC", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"}).split(" ")[1];

        Observatory.countdownTimeout = setTimeout(() => {
            Observatory.updateCountdown();
        }, timeLeft.getTime() % 1000 + 1);
    }

    // ###    ##   #  #   ##                #                 #    #                    #           #
    // #  #  #  #  ####  #  #               #                 #    #                    #           #
    // #  #  #  #  ####  #      ##   ###   ###    ##   ###   ###   #      ##    ###   ###   ##    ###
    // #  #  #  #  #  #  #     #  #  #  #   #    # ##  #  #   #    #     #  #  #  #  #  #  # ##  #  #
    // #  #  #  #  #  #  #  #  #  #  #  #   #    ##    #  #   #    #     #  #  # ##  #  #  ##    #  #
    // ###    ##   #  #   ##    ##   #  #    ##   ##   #  #    ##  ####   ##    # #   ###   ##    ###
    /**
     * Starts up the index page.
     * @returns {void}
     */
    static DOMContentLoaded() {
        Observatory.updateDiv("#hosts", "C:\\Users\\roncli\\Desktop\\roncliGaming\\The Observatory\\observatory-hosts.txt", 5000);
        Observatory.updateDiv("#standings", "C:\\Users\\roncli\\Desktop\\roncliGaming\\The Observatory\\observatory-results.txt", 5000, true);
        Observatory.updateSpotify(["#playing", "#nowPlaying"], 10000);
        Observatory.updateVideo("#video");
        Observatory.startWebsockets();
    }
}

document.addEventListener("DOMContentLoaded", Observatory.DOMContentLoaded);
