function makesBookmarksArray() {
    return [
        {
            id: 1,
            title: 'google',
            url: 'https://www.google.com/',
            description: 'search engine',
            rating: 4
        },
        {
            id: 2,
            title: 'yahoo',
            url: 'https://www.yahoo.com/',
            description: 'yahoo engine',
            rating: 4
        },
        {
            id: 3,
            title: 'testing 3',
            url: 'https://www.google.com/',
            description: 'for testing only',
            rating: 3
        },
        {
            id: 4,
            title: 'testing 4',
            url: 'https://www.google.com/',
            description: 'for testing only',
            rating:4
        },
    ];
}

module.exports = {
    makesBookmarksArray,
};