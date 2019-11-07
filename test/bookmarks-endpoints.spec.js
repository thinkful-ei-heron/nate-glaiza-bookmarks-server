/* eslint-disable quotes */
/* eslint-disable no-mixed-spaces-and-tabs */
const { makesBookmarksArray } = require('./bookmarks.fixtures');
const knex = require('knex');
const app = require('../src/app');

//only is added so that we're only running this files while working on it
describe.only('Bookmarks Endpoints', function() {
    let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    //db is the knexInstance
    app.set('db', db);
  });
  //Mocha hooks - we can pass description as the first argument for labeling purposes
  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

    describe(`Unauthorized requests`, () => {
        it(`responds with 401 Unauthorized for GET /bookmarks`, () => {
            return supertest(app)
            .get('/bookmarks')
            .expect(401, { error: 'Unauthorized request'})
        })
        it(`responds with 401 Unauthorized for POST /bookmarks`, () => {
            return supertest(app)
            .get('/bookmarks')
            .send({title: 'testing ony', url:'http://www.yahoo.com', rating: 2})
            .expect(401, { error: 'Unauthorized request'})
        })
        it(`responds with 401 Unauthorized for GET /bookmarks/:bookmarkId`, () => {
            const testBookmark = makesBookmarksArray([1]);
            return supertest(app)
            .get(`/bookmarks/${testBookmark.id}`)
            .expect(401, { error: 'Unauthorized request'})
        })
        it(`responds with 401 Unauthorized for DELETE /bookmarks/:bookmarkId`, () => {
            const testBookmark = makesBookmarksArray([1]);
            return supertest(app)
            .delete(`/bookmarks/${testBookmark.id}`)
            .expect(401, { error: 'Unauthorized request'})
        })
        
    })
    
    describe(`GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
              return supertest(app)
                .get('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, []);
            });
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makesBookmarksArray();
            
            beforeEach('insert bookmarks', () => {
                return db
                .into('bookmarks')
                .insert(testBookmarks);
            });

            it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                .get('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, testBookmarks);
            });

        });
    });

    describe(`GET /bookmarks/:bookmarkId`, () => {
        context(`Given no bookmarks`, () => {
          it(`responds with 404`, () => {
            const bookmarkId = 123;
            return supertest(app)
              .get(`/bookmarks/${bookmarkId}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(404, { error: 'Bookmark not found'});
          });
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makesBookmarksArray();
      
            beforeEach('insert bookmarks', () => {
              return db
                .into('bookmarks')
                .insert(testBookmarks);
            });
      
            it('responds with 200 and the specified article', () => {
              const bookmarkId = 2;
              const expectedArticle = testBookmarks[bookmarkId - 1];
              return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, expectedArticle);
            });
        });
    });

    //Describe for Delete
    describe(`DELETE /bookmarks/:bookmarkId`, () => {

    });

    //Descpribe for Post
    describe(`POST /bookmarks`, () => {
        
    });
});