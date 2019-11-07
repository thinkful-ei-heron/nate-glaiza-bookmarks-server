const express = require('express');
const uuid = require('uuid/v4');
const { isWebUrl } = require('isweburl');
const logger = require('../logger');
const { store }  = require('../store');

const bookmarksRouter = express.Router();
const BookmarkService = require('./bookmarks-service');
const bodyParser = express.json();

const bookmarkForm = bookmark => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: Number(bookmark.rating),
})

/* Bookmark routes */
bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarkService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
      res.json(bookmarks.map(bookmarkForm));
    })
    .catch(next);
});

bookmarksRouter
  .route('/bookmarks')
  .post(bodyParser, (req, res) => {
    for(const field of ['title', 'url', 'rating']) {
      if(!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`${field} is required`)
      }
    }

    const {title, url, description='', rating} = req.body;
    
    if(!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`);
      return res.status(400).send(`'rating' must be a number between 0 and 5`);
    }

    if(!isWebUrl(url)) {
      logger.error(`Invalid url '${url}' supplied`);
      return res.status(400).send(`'url' must be a valid URL`);
    }
    
    const bookmark = {
      id: uuid(),
      title,
      url,
      description,
      rating
    }

    store.bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${bookmark.id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
      .json(bookmark);
  })  

bookmarksRouter
  .route('/bookmarks/:bookmarkId')
  .get((req, res, next) => {

    const { bookmarkId } = req.params;
    // const bookmark = bookmarks.find(bMark => bMark.id == bookmarkId);
    const knexInstance = req.app.get('db');
    BookmarkService.getById(knexInstance, bookmarkId)
      .then(bookmark => {
          //make sure we found a bookmark
          if(!bookmark) {
            logger.error(`Bookmark with id ${bookmarkId} not found.`);
            return res
              .status(404)
              .json({ error: `Bookmark not found`});
          }
          res.json(bookmarkForm(bookmark));
      })
      .catch(next);
    })
      .delete((req, res) => {
        const { bookmarkId } = req.params;
        const bookmarkIndex = bookmarks.findIndex(bMark => bMark.id == bookmarkId);

        //checks if bookmark exists
        if(bookmarkIndex === -1) {
          logger.error(`Bookmark with id ${bookmarkId} not found.`);
          return res
            .status(404)
            .send('Not found');
        }

        //removes bookmark from bookmarks
        bookmarks.splice(bookmarkIndex, 1);

        logger.info(`Bookmark with id ${bookmarkId} deleted.`);

        res
          .status(204)
          .end();
});

module.exports = bookmarksRouter;