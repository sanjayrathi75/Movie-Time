let searchInput;
let inputType;
let movieInfo;
let bodyHeight;
let $pagination = $('#pagination-search');
let visiblePages = 10;
let totalPages;

$(document).ready(() => {
    $('button.search-button').click(() => {
        searchInput = $('.movie-search').val();
        if (!searchInput) {
            toast("No input!", "warning");
        } else {
            inputType = $('.type-select option:selected').val();
            getMovieInfo(`?s=${searchInput}&type=${inputType}`);
            $('.search-input').find('.loader').show();
        }
    });

    $('.movie-search').keypress((e) => {
        if (e.which == 13) {
            $('button.search-button').click();
        }
    });

    $('.search-outline-button').click(() => {
        let titleInput = $('#name-input').val();
        let yearInput = $('#year-input').val();
        let imbdInput = $('#imbd-input').val();
        if (!titleInput && !yearInput && !imbdInput) {
            toast("No input!", "warning");
        } else if (!titleInput && yearInput) {
            toast("Please provide title.")
        } else {
            $('.search-input').find('.loader').show();
            getMovieInfo(`?t=${titleInput}&y=${yearInput}&i=${imbdInput}`, 'title');
            getStoryline(`?t=${titleInput}&y=${yearInput}&i=${imbdInput}`);
        }
    });

    $('#name-input,#year-input,#imbd-input').keypress((e) => {
        if (e.which == 13) {
            $('.search-outline-button').click();
        }
    });

}); //end document.ready function

$(window).resize(() => {
    //setting body:before height on window resize
    if ($('#movie-card').is(":visible")) {
        $('head').find('style').remove();
        bodyHeight = $('footer').offset();
        $(`<style>body:before 
           { background-image: url(${movieInfo.Poster});
             background-size: cover;
             height: ${bodyHeight.top}px;
           }</style>`).appendTo("head");
    }

    //setting pagination width on window resize
    if ($(document).width() < 992 && $(document).width() > 400) {
        setPagination(totalPages, 4);
    } else if ($(document).width() < 400) {
        setPagination(totalPages, 1);
    } else {
        setPagination(totalPages);
    }

}); //end window.resize function

//function to show error alert
let toast = (message, type = "danger") => {
    let t = $("#toast");
    if (type == "warning") {
        t.css({
            "color": "orange",
            "bottom": "70%"
        });
    } else {
        t.css({
            "color": "rgb(242,65,65)",
            "bottom": "70%"
        });
    }
    t.text(message);
    t.animate({
        opacity: "1",
        bottom: "+=100px"
    });
    setTimeout(() => {
        t.animate({
            opacity: "0",
            bottom: "+=100px"
        });
    }, 5000);
};

//function to set pagination using 'twbsPagination' plugin
let setPagination = (totalPages, visiblePages = 10) => {
    visiblePages = visiblePages;
    $pagination.twbsPagination('destroy');
    $pagination.twbsPagination({
        totalPages: totalPages,
        visiblePages: visiblePages,
        initiateStartPageClick: false,
        hideOnlyOnePage: true,
        onPageClick: function (event, page) {
            $('#page-content').text('Page ' + page);
            getMovieInfo(`?s=${searchInput}&page=${page}&type=${inputType}`, 'search', true);
        }
    });
};

//function to get data from omdb api 
let getMovieInfo = (params, requestType = "search", pageRequst = false) => {

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: `https://www.omdbapi.com/${params}&apikey=243fd441`,

        success: (data) => {
            if (data.Response == 'True') {
                if (data.Search) {
                    //search data
                    showSearchResults(data, pageRequst);
                } else {
                    //particular movie data
                    showMovieCard(data);
                }
            } else {
                if (data.Error) {
                    toast(data.Error);
                }
            }

        },
        error: (data) => {
            if (data.statusText == "timeout") {
                toast("Request timed out. Please try again.");
            }
            if (data.statusText == "parsererror") {
                toast("Parse error! Cannot load data.");
            }
            console.log(data);
        },

        beforeSend: () => {
            if (pageRequst) {
                $('#search-results').find('.spinner-row').show();
            }
        },
        complete: (data) => {
            //if poster can't be loaded or is 404, replacing with placeholder.
            $(".movie-poster,.movie-search-poster").on("error", function () {
                console.log("HANDLING POSTER ERROR");
                this.src = `images/${inputType}-poster-placeholder.jpg`;
            });

            //scrollling window and applying background
            if (data.responseJSON !== undefined) {
                if (!data.responseJSON.Error) {
                    if (requestType == "search") {
                        $('html, body').animate({
                            scrollTop: $("#search-results").offset().top
                        }, 1000);
                    } else {
                        $('html, body').animate({
                            scrollTop: $("#movie-card").offset().top
                        }, 1000);
                        $('#result-count').css({
                            "color": "#fff",
                            "background": "rgba(247,92,81,0.8)"
                        });
                    }
                    setTimeout(() => {
                        //setting poster as body blurred background
                        if (requestType !== 'search') {
                            bodyHeight = $('footer').offset();
                            $('head').find('style').remove();
                            $(`<style>body:before 
                                { background-image: url(${movieInfo.Poster});
                                height: ${bodyHeight.top}px;
                                }</style>`).appendTo("head");
                        }
                    }, 1000);
                }
            } //end if
            //hiding loader
            $('.loader').hide();
            if (pageRequst) {
                $('#search-results').find('.spinner-row').hide();
            }

        },
        timeout: 10000
    }); // end of AJAX request

}; // end of getMovieInfo


let showSearchResults = (data, pageRequst) => {
    movieInfo = data.Search;
    $('#search-results').show();
    let searchType = inputType;
    //adding 's' to the end of searchType if it doesn't end with 's'
    //and search results are greater than 1
    if (!searchType.endsWith('s') && data.totalResults > 1) {
        searchType += 's';
    }
    $('#result-count').text(`${data.totalResults} ${searchType} found with '${searchInput}'`);

    let resultsContainer = $('#movie-results');
    resultsContainer.html(`
        <div class="spinner-row">
            <div class="spinner"></div>
        </div>
        `);

    //looping through all found movies
    for (let movie of movieInfo) {

        let moviePoster;
        if (movie.Poster !== "N/A") {
            moviePoster = movie.Poster;
        } else {
            moviePoster = `images/${inputType}-poster-placeholder.jpg`;
        }

        //adding all found movies to resultContainer
        let movieSearchCard = `
            <div class="col-5 col-sm-4 col-md-3 col-lg-2 col-xl-1 mx-2 search-card my-2">
            <div class="row text-center">
            <div class="col-12">
            <img src="${moviePoster}" class="img-fluid movie-search-poster">
            </div>
            <div class="loader col-12">
            <img src="images/loader/movie.png" class="img-fluid mt-5">
            </div>
            <small class="col-12 search-title my-1">${movie.Title}</small>
            <small class="col-12 search-year">${movie.Year}</small>
            <small class="col-12 search-imbd d-none">${movie.imdbID}</small>
            </div>
            </div>`;
        resultsContainer.append(movieSearchCard);
    } //end for loop

    //to get full details of a movie on click
    $(resultsContainer).find('.search-card').click(function () {
        let id = $(this).find('.search-imbd').text();
        getMovieInfo(`?i=${id}`, 'id');
        $(this).find('.loader').show();
        getStoryline(`?i=${id}`);
    });

    //setting pagination if it's a search request
    if (!pageRequst) {
        if ($(document).width() < 992) {
            visiblePages = 4;
        }
        totalPages = Math.ceil(data.totalResults / 10);
        setPagination(totalPages, visiblePages)
    } //end if(!pageRequest)

}; //end showSearchResults

let showMovieCard = (data) => {
    movieInfo = data;
    $('#movie-card').show();
    $('#movie-card').find('span').show();
    $(".movie-name").text(`${movieInfo.Title} (${movieInfo.Year})`);

    let moviePoster;
    if (movieInfo.Poster == "N/A") {
        moviePoster = `images/${inputType}-poster-placeholder.jpg`;
    } else {
        moviePoster = movieInfo.Poster;
    }

    $(".movie-poster").attr("src", moviePoster);
    $(".movie-runtime").text(`${movieInfo.Runtime} | ${movieInfo.Genre} | ${movieInfo.Released}`);
    $(".movie-plot").text(movieInfo.Plot);
    $(".movie-director").html(`<b>Director:</b> ${movieInfo.Director}`);
    $(".movie-writer").html(`<b>Writer:</b> ${movieInfo.Writer}`);
    $(".movie-actors").html(`<b>Actors:</b> ${movieInfo.Actors}`);
    $(".movie-box-office").html(`<b>Box office:</b>&nbsp;${movieInfo.BoxOffice}`);
    $(".movie-yt").html(`<small><a href="https://www.youtube.com/results?search_query=${movieInfo.Title} ${movieInfo.Year} trailer" target="blank">View trailer on Youtube</a></small>`);
 
    //setting movie rated certificate logo
    let rated = movieInfo.Rated;
    if (rated !== "N/A") {
        $(".movie-rated").html(`<img src="images/rated/${rated}.png" class="img-fluid" alt="${rated}">`);
    } else {
        $(".movie-rated").html('');
    }

    $(".movie-details").html(
        `<span class="col-12">
            <b>Website:</b>&nbsp;<a href="${movieInfo.Website}">${movieInfo.Website}</a>
        </span>
        <span class="col-12">
            <b>Country:</b>&nbsp;${movieInfo.Country}
        </span>
        <span class="col-12">
            <b>Language:</b>&nbsp;${movieInfo.Language}
        </span>
        <span class="col-12">
            <b>Released Date:</b>&nbsp;${movieInfo.Released}
        </span>
        <span class="col-12">
            <b>DVD:</b>&nbsp;${movieInfo.DVD}
        </span>
        <span class="col-12">
            <b>Production Co:</b>&nbsp;${movieInfo.Production}
        </span>
    `);

    $(".movie-imbd").html(
        `<span class="col-12">
            <b>Id:</b>&nbsp;${movieInfo.imdbID}
        </span>
        <span class="col-12">
            <b>Votes:</b>&nbsp;${movieInfo.imdbVotes}
        </span>
        <span class="col-12">
            <b>Rating:</b>&nbsp;${movieInfo.imdbRating}
        </span>
    `);

    if (movieInfo.Awards !== "N/A") {
        $(".awards-card").show();
        $(".movie-awards").text(movieInfo.Awards);
    } else {
        $(".awards-card").hide();
    }

    $(".movie-ratings .source").html('');
    for (let rating in movieInfo.Ratings) {
        $(".movie-ratings .source").append(`
            <div class="col-12 col-sm-4 col-md-auto text-center right-seperator">
            <div class="row align-items-center justify-content-center py-2 py-md-0">
            <div class="col-12 col-md-auto pr-md-0 pb-2 pb-md-0">
                <img class="img-fluid rating-source-logo" src="images/rating_source/${movieInfo.Ratings[rating].Source}.png">
            </div>
            <div class="col-auto reduced-line-height">
                ${movieInfo.Ratings[rating].Value}<br>
                <small>${movieInfo.Ratings[rating].Source}</small>
            </div>
            </div>
            </div>`);
    }

    $('.search-input').css("background", "rgba(0,0,0,0.7)");
    $('.display-4').find('span').first().css("background", "rgba(255,255,255,0.8)");
    $('.display-4').find('span').last().css("background", "rgba(247,92,81,0.8)");
    //hiding all spans which contains 'N/A'
    $('#movie-card').find('span:contains(N/A)').hide();
}; //end showMovieCard

//function to get movie storyline
let getStoryline = (params) => {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: `https://www.omdbapi.com/${params}&plot=full&apikey=243fd441`,
        success: (data) => {
            let storyline = $('.movie-storyline');
            let shortPlot = $('.movie-plot').text();
            storyline.parent().show();
            storyline.html(data.Plot);
            if (shortPlot == storyline.text()) {
                storyline.parent().hide();
            }
        },
        error: (data) => {},

        beforeSend: () => {

        },
        complete: () => {

        },

        timeout: 10000 // this is in milli seconds

    });
};
