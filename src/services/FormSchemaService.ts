// src/services/FormSchemaService.ts
// Use ES Module imports consistently
//import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method


class FormSchemaService {
//    private courseRepository!: Repository<Course>; // Will be set by init method
    
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    
   

    // /**
    //  * Retrieves all Course records from the database.
    //  * @returns An array of Course entities.
    //  */
    // getCourses = async (//ptenantId:string,
    //     manager?: EntityManager): Promise<Course[]> => {
       
            
    //     if (!this.courseRepository) {
    //         throw new Error("FormSchemaService repository not initialized. Call init() first.");
    //     }
    //     const courseRepository = manager ? manager.getRepository(Course) : this.courseRepository;
    //     return await courseRepository.find();//({where:{tenantId:ptenantId}}); // Use find() to get all
    // }

    
    // async getById(id: number
    //     ,manager?: EntityManager): Promise<Course | undefined> {
            
    //     if (!this.courseRepository) {
    //         throw new Error("FormSchemaService repository not initialized. Call init() first.");
    //     }
    //     const courseRepository = manager ? manager.getRepository(Course) : this.courseRepository;
        
    //     var acourse = await courseRepository.findOne({
    //         where: { id: id }
            
           
    //     });

    //     if (acourse) {
    //         return acourse;
    //     }
    //     return undefined;
    // }
// Example: Serve a static schema (for testing, but usually from DB)
 studentEnrollmentSchema = [
  { key: 'tenantId', type: 'input', props: { label: 'TenantId', required: true } ,}, // hideExpression:true,
  
  { key: 'PersonId', type: 'input', props: { label: 'PersonId', required: true } , }, // 
  { key: 'StudentProfileId', type: 'input', props: { label: 'StudentProfileId', required: true } ,hideExpression:true,}, // hideExpression:true,
  { key: 'firstName', type: 'input', props: { label: 'First Name', disabled:true, required: true } },
  { key: 'lastName', type: 'input', props: { label: 'Last Name',   disabled:true, required: true } }, 
  {
    key: 'ProgramId', // This key will bind to your model property
        type: 'select', // Specifies it's a dropdown field
        props: {
          label: 'Program', // The label displayed for the dropdown
          required: true 
        //no options, bind program options in frontend
        }
  },  
  { key: 'enrollmentDate', type: 'input', templateOptions: { label: 'enrollmentDate', "type": "date", required: true } },
  { key: 'completionDate', type: 'input', templateOptions: { label: 'completionDate', "type": "date", required: true } },

  // ... more fields
      // This is the container for the dynamically generated fields.
    // The component will populate the 'fieldGroup' array based on the selected program.
    {
      key: 'courseOfferingsGroup',
      props: {
          label: 'Course Offerings',
      },
      fieldGroup: [], // This array is where the dynamic fields will be added.
      hideExpression: '!model.ProgramId', // Hide this section until a program is selected.
  },
  
  ]; 

  
 courseSchema = [
//  { key: 'id', type: 'input', props: { label: 'id',  } ,}, 

{
  key: 'subjectId', // This key will bind to your model property
      type: 'select', // Specifies it's a dropdown field
      props: {
        label: 'Subject', // The label displayed for the dropdown
        required: true 
      //no options, bind program options in frontend
      }
}, 
  { key: 'tenantId', type: 'input', props: { label: 'TenantId', required: true } ,hideExpression:true,}, // 
  
  { key: 'courseCode', type: 'input', props: { label: 'courseCode', required: true } ,}, // hideExpression:true,

 { key: 'courseName', type: 'input', props: { label: 'courseName', required: true } ,}, // hideExpression:true,


{ key: 'description', type: 'input', props: { label: 'description',  } ,}, // hideExpression:true,
  // ... more fields
  ]; 
    
  programSchema=[
    { key: 'tenantId', type: 'input', props: { label: 'TenantId', required: true } ,hideExpression:true,}, // 
  
    { key: 'programName', type: 'input', props: { label: 'programName', required: true } ,}, 
    { key: 'programCode', type: 'input', props: { label: 'programCode', required: true } ,}, 
    { key: 'durationMonths', type: 'input', props: { label: 'durationMonths', required: true } ,}, 
    { key: 'targetExam', type: 'input', props: { label: 'targetExam', required: true } ,}, 
    { key: 'description', type: 'input', props: { label: 'description', required: true } ,}, 
     
  ]
  
  programCourseSchema=[
    { key: 'tenantId', type: 'input', props: { label: 'TenantId', required: true } ,hideExpression:true,}, // 
  
    {
      key: 'courseId', // This key will bind to your model property
          type: 'select', // Specifies it's a dropdown field
          props: {
            label: 'Course', // The label displayed for the dropdown
            required: true 
          //no options, bind program options in frontend
          }
    },
    {      key: 'programId',  type: 'input', props: { label: 'ProgramId', required: true } ,}, 
    
    { key: 'orderInProgram', type: 'input', props: { label: 'orderInProgram', required: true } ,}, 
  ]


  subjectSchema = [
        { key: 'TenantId', type: 'input', props: { label: 'TenantId', required: true } ,hideExpression:true,}, // 
        
        { key: 'subjectCode', type: 'input', props: { label: 'subjectCode', required: true } ,}, // hideExpression:true,
      
      { key: 'subjectName', type: 'input', props: { label: 'subjectName', required: true } ,}, // hideExpression:true,
      {
        key: 'isActive',
          type: 'checkbox',
          props: {
            label: 'Is Active?',
          },
        }// ... more fields
   ]; 
     
   courseofferingSchema=[
   // { key: 'courseId', type: 'input', props: { label: 'courseId', required: true } ,},
    {
      key: 'courseId', // This key will bind to your model property
          type: 'select', // Specifies it's a dropdown field
          props: {
            label: 'Course', // The label displayed for the dropdown
            required: true 
          //no options, bind program options in frontend
          }
    },
            
            {
              key: 'facultyProfileId', // This key will bind to your model property
                  type: 'select', // Specifies it's a dropdown field
                  props: {
                    label: 'facultyProfileId', // The label displayed for the dropdown
                    required: true 
                  //no options, bind program options in frontend
                  }
            },
    { key: 'offeringName', type: 'input', props: { label: 'offeringName', required: true } ,},

    
    { key: 'schedule', type: 'input', props: { label: 'schedule', required: true } ,},
    { key: 'location', type: 'input', props: { label: 'location', required: true } ,},
   ]

   //--------------------------------------------------------------------------------------------------------------------
   facultyprofileSchema=[
    { key: 'TenantId', type: 'input', props: { label: 'TenantId', required: true } ,hideExpression:true,}, // 
        
    { key: 'employeeIdNumber', type: 'input', props: { label: 'EmployeeIdNumber:', required: true } ,}, // hideExpression:true,
    // {
    //   key: 'personId', // This key will bind to your model property
    //       type: 'select', // Specifies it's a dropdown field
    //       props: {
    //         label: 'Person', // The label displayed for the dropdown
    //         required: true 
    //       //no options, bind program options in frontend
    //       }
    // },  
    { key: 'personname', type: 'input', props: { label: 'Name Of The Faculty:', required: true } ,}, // 
    { key: 'department', type: 'input', props: { label: 'Department:', required: true } ,}, // 
    { key: 'designation', type: 'input', props: { label: 'Designation:', required: true } ,}, // 

   ]

   questionSchema=[
    { key: 'tenantId', type: 'input', props: { label: 'TenantId', required: true } },
    { key: 'id', type: 'input', props: { label: 'id:',  },  hideExpression: false},
    { key: 'questionText', type: 'input', props: { label: 'questionText:', required: true }, },
   
    {
      key: 'questionTypeName',
      type: 'select',
      props: { label: 'questionTypeName', required: true }
    },

    // --- THIS IS THE CRITICAL CHANGE ---
    // This fieldGroup contains the dynamic fields for options.
    {
      "key": "options",
      "type": "repeat",
     //"hideExpression": "(model.questionTypeName !== 'MCQ-MultiCorrect' && model.questionTypeName !== 'MCQ-SingleCorrect')",// Corrected (Safe)
     // "hideExpression": "!(model.questionTypeName && (model.questionTypeName === 'MCQ-MultiCorrect' || model.questionTypeName === 'MCQ-SingleCorrect'))",
    // "hideExpression":"(model.id)",
     // The field will be hidden (hideExpression: true) if the model is defined AND
// it is NOT an MCQ type.
//"hideExpression": "model.questionTypeName && !(model.questionTypeName === 'MCQ-MultiCorrect' || model.questionTypeName === 'MCQ-SingleCorrect')",
      "props": {
          "label": "Options",
          // "required": true,
          "btnText": "Add Another Option",
          "placeholder": "",
          "disabled": false
      },
         fieldArray: {
          fieldGroup: [
            {
              key: 'optionText',
              type: 'input',
              props: {
                label: 'Option Text',
                required: true,
              },
            },
            {
              key: 'isCorrect',
              type: 'checkbox',
              props: {
                label: 'Is Correct?',
              },
            },
          ],
        },
  },

    { key: 'correctAnswer', type: 'input', props: { label: 'correctAnswer:' }, },
    { key: 'defaultPoints', type: 'input', props: { label: 'defaultPoints:'  }, },
    { key: 'explanation', type: 'input', props: { label: 'explanations:'  }, },

    // ... (Your other lookup fields remain the same) ...
    // {
    //   key: 'questionTypeName',
    //   type: 'select',
    //   props: { label: 'questionTypeName', required: true }
    // },
    {
      key: 'questionCategoryName',
      type: 'select',
      props: { label: 'questionCategoryName', required: true }
    },
    {
      key: 'questionPurposeName',
      type: 'select',
      props: { label: 'questionPurposeName', required: true }
    },
    {
      key: 'topicId',
      type: 'select',
      props: { label: 'topicId', required: false }
    },
]

assignmentSchema=[
  
  { key: 'tenantId', type: 'input', props: { label: 'TenantId', required: true }  ,hideExpression:true},
  { key: 'id', type: 'input', props: { label: 'id:',  },  hideExpression: true},
  { key: 'assignmentName', type: 'input', props: { label: 'Assignment Name:', required: true }, },
  { key: 'description', type: 'input', props: { label: 'description:', required: true }, },
  { key: 'dueDate', type:'input',  templateOptions: { label: 'dueDate:' , "type": "date", required: true }, },
  { key: 'visibilityDate', type:'input',  templateOptions: { label: 'visibilityDate:' , "type": "date", required: true }, },
  { key: 'assignmentPurpose', type: 'select', props: { label: 'purpose:', required: true }, },
  
    // This field group is now hidden when the assignmentPurpose is NOT "Quiz"
    {
      hideExpression: 'model.assignmentPurpose !== "Quiz"',
      fieldGroup: [
          {
              key: 'quizTimingType',
              type: 'radio',
              props: {
                  label: 'Quiz Timing',
                  required: true,
                  options: [
                      { value: 'PerQuestion', label: 'Time per Question' },
                      { value: 'TotalQuiz', label: 'Total Quiz Time' },
                  ]
              }
          },
          {
              key: 'questionTimeLimitSeconds',
              type: 'input',
              hideExpression: 'model.quizTimingType !== "PerQuestion"',
              props: {
                  label: 'Time per Question (in seconds)',
                  required: true,
                  type: 'number',
                  min: 1
              }
          },
          {
              key: 'quizTimeLimitSeconds',
              type: 'input',
              hideExpression: 'model.quizTimingType !== "TotalQuiz"',
              props: {
                  label: 'Total Quiz Time (in seconds)',
                  required: true,
                  type: 'number',
                  min: 1
              }
          }
      ]
  },

  {
    key: 'courseOfferingId', // This key will bind to your model property
        type: 'select', // Specifies it's a dropdown field
        props: {
          label: 'CourseOffering', // The label displayed for the dropdown
          required: true 
        //no options, bind program options in frontend
        }
  },
  {key:'assignmentQuestions', type:'question-picker', props:{label:'Select Questions'}}
]


assignmentSchemaSolving = 
[
  { "key": "tenantId", "type": "input", "props": { "label": "TenantId" }, "hideExpression": true },
  { "key": "id", "type": "input", "props": { "label": "id:" },    "hideExpression": true },
  {
    "key": "assignmentQuestions",
    "type": "repeat",
    "props": {
      "label": "Assignment QuestionsAAAAAAAAAAAAAAAAAAA",
      "btnText": "Add Another Option",
      "placeholder": "",
      "disabled": false
    },
    "fieldArray": {
      "fieldGroup": [
        {
          "key": "question.id",
          "type": "input",
          "props": { "label": "Question id", "readonly": true }, "hideExpression": false ,
         
        },
       
      {
          "key": "question.questionText", // The key should point to the question object
          "type": "questionTextDisplay",
          "props": { 
            "label": "Question Text"
          },
          "className": "custom-width-input-question-text"
        },
        //The studentAnswer field must be placed here.
        {
          "key": "studentAnswer",
          "type": "studentAnswerType",
          "props": { "label": "Select your answer:" },
          "className": "select-your-answer"
        },
        
       
      ]
    }
  }
]

assignmentSchemaSolving_SingleQuestion=
[
      {
        "key": "question.id",
        "type": "input",
        "props": { "label": "Question id", "readonly": true }, "hideExpression": true ,
        "className": "custom-width-input-question-text"
      },
      // {
      //   // Field for the question text
      //   key: 'question.questionText',
      //   type: 'input',
      //   props: { label: 'Question', readonly: true }
      // },
      {
        "key": "question.questionText", // The key should point to the question object
        "type": "questionTextDisplay",
        "props": { 
          "label": "Question Text"
        },
        "className": "custom-width-input-question-text"
      },
      {
        // Field for the student's answer using your custom type
        key: 'studentAnswer',
        type: 'studentAnswerType',
        props: { label: 'Select your answer:' }
      }
]



AssignmentAssessmentSchema=
[
  
  { "key": "tenantId", "type": "input", "props": { "label": "TenantId" }, "hideExpression": true },
  { "key": "id", "type": "input", "props": { "label": "id:" },    "hideExpression": true },
  { "key": "assignmentName", "type": "input", "props": { "label": "Assignment Name:", }, },
  { "key": "courseOfferingId", "type": "input", "props": { "label": "courseOfferingId:", }, },  
  { "key": "assignmentPurpose", "type": "input", "props": { "label": "assignmentPurpose:", }, },
  { "key": "description", "type": "input", "props": { "label": "description", }, },
  
  { "key": "dueDate", "type": "input", "props": { "label": "dueDate", }, },
  
]

assessAssignment=
[
  { "key": "tenantId", "type": "input", "props": { "label": "TenantId" }, "hideExpression": true },
  { "key": "id", "type": "input", "props": { "label": "id:" },    "hideExpression": false },

  {
    "key": "studentQuestionAnswers",
    "type": "repeat",
    "props": {
        "label": "studentQuestionAnswers",
        // "required": true,
        "btnText": "Add Another Option",
        "placeholder": "",
        "disabled": false
    },
       fieldArray: {
        fieldGroup: [
          {
            key: 'question.questionText',
            type: 'input',
            props: {
              label: 'QText',
              required: true,
              "readonly": true
            },
            "className": "custom-width-input-question-text"
          },
          {
            key: 'studentAnswerContent',
            type: 'input',
            props: {
              label: 'studentAnswerContent',
              "readonly": true
            },
          },



          {
            key: 'isCorrect',
            type: 'input',
            props: {
              label: 'isCorrect',
            },
          },
          {
            key: 'scoreEarned',
            type: 'input',
            props: {
              label: 'scoreEarned',
            },
          },
          {
            key: 'teacherFeedback',
            type: 'input',
            props: {
              label: 'teacherFeedback',
            },
          },

        ],
      },
},
]
   //--------------------------------------------------------------------------------------------------------------------
      

    async  getSchema_Subject()
    {
         return  this.subjectSchema
    }

  async  getSchema_Enrollment()
    {
         return  this.studentEnrollmentSchema
    }
    
  async  getSchema_Course()
  {
       return  this.courseSchema
  } 
  async getSchema_Program(){
    return this.programSchema
  }
  async getSchema_ProgramCourse(){
    return this.programCourseSchema
  }
  async  getSchema_CourseOffering()
  {
       return  this.courseofferingSchema
  }
  
  async  getSchema_FacultyProfile()
  {
       return  this.facultyprofileSchema
  }
  
  async getSchema_Question()
  {
    return this.questionSchema
  }
  async getSchema_Assignment()
  {
    return this.assignmentSchema
  }
  
  async getSchema_AssignmentSolving()
  {
    return this.assignmentSchemaSolving
  }
  async getSchema_AssignmentSolving_SingleQuestion()
  {
    return this.assignmentSchemaSolving_SingleQuestion
  }
  async getSchema_AssignmentAssessment()
  {
    return this.AssignmentAssessmentSchema
  }
  async getSchema_assessAssignment()
  {
    return this.assessAssignment
  }
}



export default FormSchemaService;