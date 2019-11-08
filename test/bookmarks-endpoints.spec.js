/* eslint-disable quotes */
/* eslint-disable no-mixed-spaces-and-tabs */
const { makesBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');
const knex = require('knex');
const app = require('../src/app');
const { isWebUri } = require('valid-url');

//only is added so that we're only running this files while working on it
describe('Bookmarks Endpoints', function() {
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

    //Describe for all Unauthorized request
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
    
    //Describe for GET /bookmarks
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
        context(`Given an XSS attack bookmark`, () => {
          const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
    
          beforeEach('insert malicious bookmark', () => {
            return db
              .into('bookmarks')
              .insert([ maliciousBookmark ]);
          });
    
          it('removes XSS attack content', () => {
            return supertest(app)
              .get(`/bookmarks`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(200)
              .expect(res => {
                expect(res.body[0].title).to.eql(expectedBookmark.title);
                expect(res.body[0].description).to.eql(expectedBookmark.description);
              });
          });
        });
    });//end of GET /bookmarks

    //Describe for Get /bookmarks/:bookmarkId
    describe(`GET /bookmarks/:bookmarkId`, () => {
        context(`Given no bookmarks`, () => {
          it(`responds with 404`, () => {
            const bookmarkId = 123;
            return supertest(app)
              .get(`/bookmarks/${bookmarkId}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(404, { error:  {message: `Bookmark doesn't exist`}});
          });
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makesBookmarksArray();
      
            beforeEach('insert bookmarks', () => {
              return db
                .into('bookmarks')
                .insert(testBookmarks);
            });
      
            it('responds with 200 and the specified bookmark', () => {
              const bookmarkId = 2;
              const expectedBookmark= testBookmarks[bookmarkId - 1];
              return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, expectedBookmark);
            });
        });

        context(`Given an XSS attack bookmark`, () => {
          const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
    
          beforeEach('insert malicious bookmark', () => {
            return db
              .into('bookmarks')
              .insert([ maliciousBookmark ]);
          });
    
          it('removes XSS attack content', () => {
            return supertest(app)
              .get(`/bookmarks/${maliciousBookmark.id}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(200)
              .expect(res => {
                expect(res.body.title).to.eql(expectedBookmark.title);
                expect(res.body.url).to.eql(expectedBookmark.url);
                expect(res.body.description).to.eql(expectedBookmark.description);
              });
          });
        });
    });//end of GET /bookmarks/:bookmarkId

    //Describe for Post
    describe(`POST /bookmarks`, () => {
        it(`creates a new bookmark, responding with 201 and the new bookmark`, () => {
            // this.retries(3);
            const newBookmark= {
              id: 1,
              title: 'Test for new Bookmark',
              url: 'https://www.google.com/',
              description: 'For testing only',
              rating: 4,
            };
            return supertest(app)
              .post(`/bookmarks`)
              .send(newBookmark)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(201)
              .expect(res => {
                expect(res.body.title).to.eql(newBookmark.title);
                expect(res.body.url).to.eql(newBookmark.url);
                expect(res.body.description).to.eql(newBookmark.description);
                expect(res.body.rating).to.eql(newBookmark.rating);
                expect(res.body).to.have.property('id');
                expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
              })
              .then(postRes =>
                 supertest(app)
                   .get(`/bookmarks/${postRes.body.id}`)
                   .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                   .expect(postRes.body)
              );
          });

        //refactor equivalent for 400
        const requiredFields = ['title', 'url', 'rating'];

        requiredFields.forEach(field => {
          const newBookmark = {
            title: 'Test new bookmark',
            url: 'https://www.google.com/',
            rating: 5
          };

       it(`responds with 400 and an error message when the '${field}' is missing`, () => {
          delete newBookmark[field];

          return supertest(app)
            .post('/bookmarks')
            .send(newBookmark)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: { message: `'${field}' is required` }
            });
        });
      });
      it('removes XSS attack content from response', () => {
        const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
        return supertest(app)
          .post(`/bookmarks`)
          .send(maliciousBookmark)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.url).to.eql(expectedBookmark.url);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    }); //end of POST

    //Describe for DELETE
    describe(`DELETE /bookmarks/:bookmarkId`, () => {
      context(`Given no bookmarks`, () => {
        it(`responds with 400`, () => {
          const bookmarkId = 123456;
          return supertest(app)
            .delete(`/bookmarks/${bookmarkId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, { error: { message: `Bookmark doesn't exist` } })
        });
      });
  
      context('Given there are bookmarks in the database', () => {
        const testBookmarks = makesBookmarksArray()
  
        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks')
            .insert(testBookmarks);
        });
  
        it('responds with 204 and removes the bookmark', () => {
          const idToRemove = 2;
          const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
          return supertest(app)
            .delete(`/bookmarks/${idToRemove}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/bookmarks`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(expectedBookmarks)
            );
        });
      });
    }); //end of DELETE
});