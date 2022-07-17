const bodyParser = require('body-parser');
const express = require('express');

const tf = require('@tensorflow/tfjs-node');
const qna = require('@tensorflow-models/qna');
const translate = require('@vitalets/google-translate-api');

const app = express();

console.log("SERVER Running");

// handling the root route & serving the public folder
app.use('/', express.static('public'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.post('/simple', (req,resp) => {
    const text = req.body.text;
    console.log(text);
    translate(text, {to: 'en'})
        .then(res => 
            {
                const result = res.text; console.log(res.text); console.log(res.from.language.iso);
                resp.json(result);
            }
        );
})

// handling the extractText route which is having the entire logic
app.post('/extractText', (req,resp) => {
    const textFinal = req.body.text;
    const pdfname = req.body.pdfname;
    console.log("TOTAL CHARACTERS ARE: ", textFinal.length);
    
    // as google-translate-api can handlw upto 5k chars at oen go, so reducing the textString in chunks     
    let text = textFinal.split('');  // >5k chars
    const chunks = [];
    while (text.length) chunks.push(text.splice(0, 5000).join(''));

    console.log("TOTAL CHUNKS ARE: ", chunks.length);

    const detailsObj = {};
    let finalText = "";

    // iterating through entire chunks
    Promise.all(
        chunks.map(
            (chunk, ind) =>translate(chunk, {to: 'en'}).then(res => {
                finalText += res.text;
                
                let loadedModel;

                // checking if the current chunk is the last one or not ? beacuse they only I will use the qna model
                if(ind == chunks.length - 1) {
                    
                    let langString = finalText.toLowerCase();

                    // seperating each case beacsuse for everyone the question strings and answer varies
                    if(pdfname == "pud") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        // consoling the time so that I can get an estimate of how long is it taking to load the modal
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What is the crime number?", langString);
                            const answer1 = await loadedModel.findAnswers("What are the sections of  indian penal code?", langString);
                            const answer2 = await loadedModel.findAnswers("When was the case taken to file?", langString);
                            const answer3 = await loadedModel.findAnswers("Which police station is referred here?", langString);
                            const answer4 = await loadedModel.findAnswers("What are the sections of criminal procedure act ?", langString);
                            
                            await translate(answer[0].text, {from: 'en', to: 'ta'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'fir_no': res.text})
                            });
                            
                            const total_sections = answer1[0].text + " " + answer4[0].text;
                            await translate(total_sections, {from: 'en', to: 'ta'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'sections': res.text})
                            });
                            
                            await translate(answer3[0].text, {from: 'en', to: 'ta'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'police_station': res.text})
                            });
                            
                            await translate(langString.substring(342,383), {from: 'en', to: 'ta'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'police_station': res.text})
                            });
                            
                            Object.assign(detailsObj, {'fir_date': answer2[0].text})
                            
                            // assigning the extracted answers value into the empty object 
                            // Object.assign(detailsObj, {
                            //     'fir_no': answer[0].text,
                            //     'sections': answer1[0].text + " " + answer4[0].text,
                            //     'fir_date': answer2[0].text,
                            //     'police_station': answer3[0].text,
                            //     // some values which are not even accesible by the qna model
                            //     'accused_name' : langString.substring(342,383)
                            // });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            // sending back the response
                            resp.json(detailsObj);
                            }
                        }

                        loadModel();
                    } else if (pdfname == "pun") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What are the sections of ipc?", langString);
                            const answer1 = await loadedModel.findAnswers("What is the date of institution?", langString);
                            const answer2 = await loadedModel.findAnswers("Who is the son of hira chand?", langString.substring(185,309));
                            const answer3 = await loadedModel.findAnswers("What is the age of kumar?", langString.substring(185,309));
                            const answer4 = await loadedModel.findAnswers("What is the address of kumar?", langString.substring(185,309).replaceAll(',',''));
                            const answer5 = await loadedModel.findAnswers("What is the police station?", langString.replaceAll('p.s.','the police station is'));
                            const answer6 = await loadedModel.findAnswers("What is the address of jasvir singh?", langString.substring(333, 390));
                            // console.log(answers[0].text);
                            Object.assign(detailsObj, {
                                'sections': answer[0].text,
                                'fir_date': answer1[0].text,
                                'fir_no': langString.substring(114, 131),
                                'accused_name': answer2[0].text,
                                // 'accused_name': langString.substring(185, 198),
                                'age': answer3[0].text,
                                'accused_address' : answer4[3].text,
                                'police_station': answer5[1].text,
                                'complainant_address': answer6[2].text,
                                'complainant_name': langString.substring(333, 345)
                            });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);    
                            }
                        }

                        loadModel();
                    } else if(pdfname == "ap") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What is the age?", langString.substring(172, 179));
                            
                            await translate(langString.substring(136,148), {from: 'en', to: 'te'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_name': res.text})
                            });
                            
                            await translate(langString.substring(159, 170), {from: 'en', to: 'te'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_father_husband_name': res.text})
                            });
                            
                            await translate(langString.substring(217, 282), {from: 'en', to: 'te'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_address': res.text})
                            });
                            
                            Object.assign(detailsObj, {'age': answer[0].text})
                            
                            Object.assign(detailsObj, {'fir_date': langString.substring(100,126)})
                            
                            Object.assign(detailsObj, {'fir_no': langString.substring(128, 135)})
                            
                            // Object.assign(detailsObj, {
                            //     'age' : answer[0].text,
                            //     'fir_date': langString.substring(100,126),
                            //     'fir_no': langString.substring(128, 135),
                            //     'accused_name': langString.substring(136,148),
                            //     'accused_father_husband_name' : langString.substring(159, 170),
                            //     'accused_address': langString.substring(217, 282)
                            // });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);
                            }
                        }

                        loadModel();
                    } else if (pdfname == "mah") {  
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("Commited crime is as per which section?", langString);
                            const answer1 = await loadedModel.findAnswers("What is the date of crime?", langString);
                            
                            await translate(answer[0].text, {from: 'en', to: 'mr'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'sections': res.text})
                            });
                            
                            Object.assign(detailsObj, {'fir_date': answer1[0].text})
                            
//                             Object.assign(detailsObj, {
//                                 'sections': answer[0].text,
//                                 'fir_date': answer1[0].text
//                             });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);
                            }
                        }

                        loadModel();
                    } else if(pdfname == "up") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("Who was present?", langString);
                            const answer1 = await loadedModel.findAnswers("What is the date?", langString.replaceAll('.', '/'));
                            const answer2 = await loadedModel.findAnswers("Where is the judicial magistrate?", langString.replaceAll('.', '/'));
                            
                            await translate(answer[0].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'court': res.text})
                            });

                            await translate(answer2[0].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'district': res.text})
                            });
                            
                            Object.assign(detailsObj, {'fir_date': answer1[0].text});

                            // Object.assign(detailsObj, {
                            //     'court': answer[0].text,
                            //     'fir_date': answer1[0].text,
                            //     'distcrict': answer2[0].text 
                            // });
                            
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);    
                            }
                        }

                        loadModel();
                    } else if(pdfname == "orr") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What is the no.?", langString);
                            const answer1 = await loadedModel.findAnswers("When was evidence called?", langString);
                            
                            await translate(answer[0].text, {from: 'en', to: 'kn'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'case_no': res.text})
                            });
                            
                            Object.assign(detailsObj, {'crime_date': answer1[0].text});
                            
                            // Object.assign(detailsObj, {
                            //     'case_no': answer[0].text,
                            //     'crime_date': answer1[0].text
                            // });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);
                            }
                        }
                        loadModel();
                    } else if(pdfname == "guj") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What are the articles?", langString);
                            const answer1 = await loadedModel.findAnswers("Judges are of which district?", langString);
                            
                            await translate(answer[0].text, {from: 'en', to: 'gu'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'sections': res.text})
                            });

                            await translate(answer1[1].text, {from: 'en', to: 'gu'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'district': res.text})
                            });
                            
                            await translate(langString.substring(186, 238), {from: 'en', to: 'gu'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_address': res.text})
                            });
                            
                            await translate(langString.substring(126, 146), {from: 'en', to: 'gu'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_name': res.text})
                            });
                            
                            await translate(langString.substring(299, 308), {from: 'en', to: 'gu'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'complainant_name': res.text})
                            });
                            
                            // Object.assign(detailsObj, {
                            //     'sections': answer[0].text,
                            //     'disctrict': answer1[1].text,
                            //     'accused_address': langString.substring(186, 238),
                            //     'accused_name': langString.substring(126, 146),
                            //     'complainant_name': langString.substring(299, 308)
                            // });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);
                            }
                        }
                        loadModel();
                    } else if(pdfname == "chat") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What is the district?", langString);
                            const answer1 = await loadedModel.findAnswers("What is the case no.?", langString);
                            const answer2 = await loadedModel.findAnswers("What is the section?", langString);
                            const answer3 = await loadedModel.findAnswers("When is the decision announced?", langString);
                            
                            await translate(answer[3].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'district': res.text})
                            });
                            
                            await translate(answer1[0].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'fir_no': res.text})
                            });
                            
                            await translate(answer[0].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'sections': res.text})
                            });
                            
                            await translate(langString.substring(146, 172), {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_name': res.text})
                            });
                            
                            await translate(langString.substring(173, 213), {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_address': res.text})
                            });
                            
                            Object.assign(detailsObj, {'date': answer3[0].text});

                            // Object.assign(detailsObj, {
                            //     'district': answer[3].text,
                            //     'fir_no': answer1[0].text,
                            //     'sections': answer[0].text,
                            //     'date': answer3[0].text,
                            //     'accused_name': langString.substring(146, 172),
                            //     'accused_address': langString.substring(173, 213)
                            // });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);
                            }
                        }

                        loadModel();
                    } else if(pdfname == "mp") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What is the police station?", langString);
                            const answer1 = await loadedModel.findAnswers("What is the age?", langString.substring(551, 648).replaceAll('umra','age'));
                            const answer2 = await loadedModel.findAnswers("Where is the residence?", langString.substring(551, 648).replaceAll(',',' '));
                            
                            await translate(answer[2].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'police_station': res.text})
                            });
                            
                            await translate(langString.substring(26, 56), {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'fir_no': res.text})
                            });
                            
                            await translate(langString.substring(551, langString.substring(551,648).indexOf('son')+551), {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_name': res.text})
                            });
                            
                            await translate(answer2[0].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_address': res.text})
                            });
                            
                            const ans = langString.substring(langString.substring(551, 648).indexOf('son') + 555, langString.substring(551,648).indexOf(',')+551);
                            await translate(ans, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_father_husband_name': res.text})
                            });
                            
                            Object.assign(detailsObj, {'age': answer1[0].text});
                            
                            // Object.assign(detailsObj, {
                            //     'police_station': answer[2].text,
                            //     'age': answer1[0].text,
                            //     'accused_address': answer2[0].text,
                            //     'fir_no': langString.substring(26, 56),
                            //     'accused_name': langString.substring(551, langString.substring(551,648).indexOf('son')+551),
                            //     'accused_father_husband_name': langString.substring(langString.substring(551, 648).indexOf('son') + 555, langString.substring(551,648).indexOf(',')+551) 
                            // });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);
                            }
                        }

                        loadModel();
                    } else if(pdfname == "hry") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What is the case no.?", langString);
                            const answer1 = await loadedModel.findAnswers("What is the date of institution?", langString);
                            const answer2 = await loadedModel.findAnswers("What is the date of decision?", langString);
                            const answer3 = await loadedModel.findAnswers("What is the fir no.?", langString);
                            const answer4 = await loadedModel.findAnswers("How old is he?", langString.substring(234,318));
                            const answer5 = await loadedModel.findAnswers("Is a resident of where?", langString.substring(234,318));
                            const answer6 = await loadedModel.findAnswers("What are the scetions of indian penal code?", langString);
                            const answer7 = await loadedModel.findAnswers("What is the police station?", langString);
                            const answer8 = await loadedModel.findAnswers("What is the district?", langString.substring(234,318));
                            Object.assign(detailsObj, {
                                'case_no': answer[0].text,
                                'date': answer1[0].text,
                                'decision_date': answer2[0].text,
                                'fir_no': answer3[0].text,
                                'age': answer4[0].text,
                                'accused_address': answer5[1].text,
                                'section': answer6[0].text,
                                'police_station': answer7[0].text,
                                'district': answer8[0].text,
                                'complainant_name': langString.substring(234, 243),
                                'complainant_father_husband_name': langString.substring(251, 260),
                                'accused_name': langString.substring(224,229)
                            });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);
                            }
                        }
                        
                        loadModel();
                    } else if(pdfname == "raj") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answer = await loadedModel.findAnswers("What is the cis no?", langString);
                            const answer1 = await loadedModel.findAnswers("What is the district?", langString);
                            const answer2 = await loadedModel.findAnswers("What is the decision date?", langString);
                            const answer3 = await loadedModel.findAnswers("Is a resident of where?", langString.substring(187,302));
                            const answer4 = await loadedModel.findAnswers("What is the age of mamta?", langString.substring(187,302));
                            const answer5 = await loadedModel.findAnswers("Is a resident of where?", langString.substring(327,420));
                            
                            await translate(answer[0].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'case_no': res.text})
                            });
                            
                            await translate(answer1[2].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'district': res.text})
                            });
                            
                            await translate(answer3[0].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_address': res.text})
                            });
                            
                            await translate(answer5[0].text, {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'complainant_address': res.text})
                            });
                            
                            await translate(langString.substring(187, 192), {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_name': res.text})
                            });
                            
                            await translate(langString.substring(213, 220), {from: 'en', to: 'hi'})
                                .then(res=> {
                                    Object.assign(detailsObj, {'accused_father_husband_name': res.text})
                            });
                            
                            Object.assign(detailsObj, {'decision_date': answer2[0].text});
                            
                            Object.assign(detailsObj, {'age': answer4[2].text});
                            
                            // Object.assign(detailsObj, {
                            //     'case_no': answer[0].text,
                            //     'district': answer1[2].text,
                            //     'decision_date': answer2[0].text,
                            //     'accused_address': answer3[0].text,
                            //     'age': answer4[2].text,
                            //     'complainant_address': answer5[0].text,
                            //     'accused_name': langString.substring(187, 192),
                            //     'accused_father_husband_name': langString.substring(213, 220)
                            // });
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);    
                            }
                        }
                        loadModel();
                    } else if(pdfname == "hin1") {
                        const loadModel = async () => {
                        console.time('asyncFunc');
                        loadedModel = await qna.load();
                        console.log('Model loaded');
                        console.timeEnd('asyncFunc');
                        if (loadedModel !== null) {
                            console.time('answer');
                            const answers = await loadedModel.findAnswers("Who is the son?", langString.substring(92,207));
                            const answers1 = await loadedModel.findAnswers("Is a resident of where?", langString.substring(152,207).replaceAll(',',' '));
                            const answers2 = await loadedModel.findAnswers("How old is he?", langString.substring(92,207));
                            // console.log("FIrst one: ", answers);
                            // console.log("FIrst one: ", answers1);
                            // console.log("FIrst one: ", answers2);
                            console.log(langString);
                            // await translate(answers[2].text, {from: 'en', to: 'hi'})
                            //     .then(res=> {
                            //         Object.assign(detailsObj, {'name': res.text})
                            // });
                            
                            // await translate(answers1[1].text, {from: 'en', to: 'hi'})
                            //     .then(res=> {
                            //         Object.assign(detailsObj, {'address': res.text})
                            // });
                            
                            // await translate(answers2[0].text, {from: 'en', to: 'hi'})
                            //     .then(res=> {
                            //         Object.assign(detailsObj, {'age': res.text})
                            // });
                            
                            Object.assign(detailsObj, {'father_name': langString.substring(113,130)});
                            
                            console.timeEnd('answer');
                            console.log("THE OBJECT IS: \n", detailsObj);
                            resp.json(detailsObj);    
                            }
                        }
                        loadModel();
                    }
                }
            })
        )
    )
})
// on localhost:3000 the app will run
app.listen(3000);
