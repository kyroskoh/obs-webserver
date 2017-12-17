var delay = 20000,
    tiers = [
        "Play-in Round 1",
        "Play-in Round 2",
        "Play-in Semis"
    ];

document.addEventListener("DOMContentLoaded", function(ev) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function() {
        if (x.readyState === 4 && x.status === 200) {
            start(JSON.parse(x.responseText));
        }
    };
    x.open("GET", "api/necrodancerCondor5", true);
    x.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    x.send();
});

function start(data) {
    var tier = 0,
        status = 0,
        index = 0,

        $results = document.querySelector(".results"),
        $upcoming = document.querySelector(".upcoming"),

        next = function() {
            switch (status) {
                case 0:
                    nextResults();
                    break;
                case 1:
                    nextUpcoming();
                    break;
            }
        },

        nextResults = function() {
            var $tbody = document.querySelector(".results tbody"),
                ix, result;
            
            $results.classList.remove("hidden");
            $upcoming.classList.add("hidden");

            document.querySelector(".tier").innerText = tiers[tier];

            while ($tbody.firstChild) {
                $tbody.removeChild($tbody.firstChild);
            }

            delay = 0;

            for (ix = index; ix < index + 20 && ix < data[tiers[tier]].previousResults.length; ix++) {
                delay = 20000;
                result = data[tiers[tier]].previousResults[ix];

                var row = document.createElement("tr"),
                    node;
                
                node = document.createElement("td");
                node.innerText = result.player1 || "";
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = result.player2 || "";
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = result.dateStr || "";
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = result.score + (result.winner ? " " + result.winner : "");
                row.appendChild(node);

                $tbody.appendChild(row);
            }

            if (data[tiers[tier]].previousResults.length > index + 20) {
                index += 20;
            } else {
                if (tier < tiers.length - 1) {
                    tier++;
                    index = 0;
                } else {
                    tier = 0;
                    index = 0;
                    status = 1;
                }
            }

            setTimeout(next, delay);
        },

        nextUpcoming = function() {
            var $tbody = document.querySelector(".upcoming tbody"),
                ix, match;
            
            $results.classList.add("hidden");
            $upcoming.classList.remove("hidden");

            document.querySelector(".tier2").innerText = tiers[tier];

            while ($tbody.firstChild) {
                $tbody.removeChild($tbody.firstChild);
            }

            delay = 0;

            for (ix = index; ix < index + 20 && ix < data[tiers[tier]].upcomingMatches.length; ix++) {
                delay = 20000;
                match = data[tiers[tier]].upcomingMatches[ix];

                var row = document.createElement("tr"),
                    node;
                
                node = document.createElement("td");
                node.innerText = match.player1 || "";
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = match.player2 || "";
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = match.dateStr || "";
                row.appendChild(node);

                node = document.createElement("td");
                node.innerText = match.cawmentary || "";
                row.appendChild(node);

                $tbody.appendChild(row);
            }

            if (data[tiers[tier]].upcomingMatches.length > index + 20) {
                index += 20;
            } else {
                if (tier < tiers.length - 1) {
                    tier++;
                    index = 0;
                } else {
                    tier = 0;
                    index = 0;
                    status = 0;
                }
            }

            setTimeout(next, delay);
        };

    next();
}
