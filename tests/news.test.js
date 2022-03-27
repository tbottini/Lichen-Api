const {UserTestHandler} = require("./userTestHandler");
const request = require("supertest");
const app = require("../srcs/index");
const { PrismaClient } = require("@prisma/client");

describe("News Routes Test", () => {

    ref = {};

    beforeAll(async () => {
        ref.user = await UserTestHandler.addUser({
            email: "news@journaux.com", 
            firstname: "news", 
            lastname: "dumont", 
        })

        console.log("NEWS", ref.user);
    })

    it("check the insertion time of elements database", async () => {
        var newUser = await UserTestHandler.addUser({email: "lefantomeducoin@journaux.com", firstname: "lefanto", lastname: "me",
         projects: [
            
            {
            title: "p1", 
            medium: "SCULPTURE", 
            artworks: [ 
                {title: "artworks1", medium: "SCULPTURE" }
            ]
        }
    ],
        events: [
            {
                name: "e1",
                description: "description", 
                medium: "SCULPTURE",
                dateStart: Date.UTC(2000, 12, 30, 12, 30, 10)
            }
        ]
    
    });

        console.log("NEWUSER", newUser);

        var newUser = await request(app).get("/users/self")
        .set("Authorization", "bearer " + newUser.token)

        console.log("USERCHECK", newUser.body);
        newUser = newUser.body;
        expect(newUser).toMatchObject({
            projects: [
               { title: "p1",
                artworks: [
                    {
                        title: "artworks1"
                    }
                ]
            }, 
            ],
            events: [{name: "e1", }]
        })

        var now = new Date(Date.now()); 
        console.log("EVENT HOUR", now);
        now = now.getHours();
        var artworkHour = new Date(newUser.projects[0].artworks[0].insertion);
        artworkHour = artworkHour.getHours();
        var eventHour = new Date(newUser.events[0].insertion);
        console.log("EVENT HOUR", eventHour); 
        
        eventHour = eventHour.getHours();

        console.log("EVENT HOUR", eventHour, now)

        expect(eventHour).toBe(now);


        

        console.log(now.getHour)

        // var res = await request(app).post("/users/" + newUser.id.toString() + "/follow")
        // .set("Authorization", "bearer " + ref.user)
        
        // var res = await request(app).get("/news/"); 
        // console.log("NEWS", res.body);
    })


    afterAll(async () => {
        await UserTestHandler.clearDatabase();
    })

})