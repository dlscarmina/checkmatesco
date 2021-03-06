class RecurringTaskFactory {
  constructor(taskdb, matesArray, tasksArray) {
    this.task = new Task();
    this.tasks = tasksArray;
    this.mates = matesArray;
    this.taskdb = taskdb;
  }

  async createTask() {
    this.populateTask();
    this.task.setTaskID(await this.insertTaskIntoFirestore());
    return this.task;
  }

  populateTask() {
    this.task.setTitle($("#titleField").val());
    this.task.setDescription($("#descriptionField").val())
    this.task.setDueDate($("#dueDateField").val());
    this.task.setDueTime($("#dueTimeField").val());
    this.task.setIsRecurring(true);
    this.task.setRecurringPeriod($('#recurringPeriodField').val());
    this.task.setSpaceID(sessionStorage.getItem("Space"));
    this.task.setAssignedMateID(this.setFirstMateAssignedToRecurringTask());
    this.task.setIsComplete(false);
    this.task.setFavorMateID('');
  }

  async insertTaskIntoFirestore() {
    // Setting firestore data
    let data = {
      tskTitle: this.task.getTitle(),
      tskDescription: this.task.getDescription(),
      tskDueDate: this.task.getDueDate(),
      tskDueTime: this.task.getDueTime(),
      tskIsRecurring: this.task.getIsRecurring(),
      tskRecurringPeriod: this.task.getRecurringPeriod(),
      tskAssignedMateID: this.task.getAssignedMateID(),
      tskIsComplete: this.task.getIsComplete(),
      tskSpaceID: this.task.getSpaceID(),
      tskFavorMateID: this.task.getFavorMateID()
    }

    // Add Task to Space in db
    let docRef = await this.taskdb.add(data);
    var spaceID = sessionStorage.getItem("Space");
    var spacedb = firebase.firestore().collection("Spaces").doc(spaceID);
    await spacedb.update({
      spcTasks: firebase.firestore.FieldValue.arrayUnion(docRef.id),
    });
    return docRef.id;
  }

  getNumberOfMatesRecurringTasks(mateID) {
      var numTasks = 0;
      for (var i = 0; i < this.tasks.length; ++i) {
          var tempTask = this.tasks[i];
          if (tempTask.assignedMateID == mateID &&
              tempTask.isRecurring &&
             !tempTask.isComplete) {
              ++numTasks;
          }
      }
      return numTasks;
  }

  setFirstMateAssignedToRecurringTask() {
      if (this.mates.length == 0) {
          alert("No mates in the living space.");
          return;
      }

      let minNumTasks = this.getNumberOfMatesRecurringTasks(this.mates[0].getID());
      var minTaskMates = [];
      minTaskMates.push(this.mates[0].getID());

      for (var i = 1; i < this.mates.length; ++i) {
          let j = this.getNumberOfMatesRecurringTasks(this.mates[i].getID()); //would be more efficient to get all the number of tasks in one shot...
          if (j < minNumTasks) {
              minNumTasks = j;
              minTaskMates = [];
              minTaskMates.push(this.mates[i].getID());
          } else if (j == minNumTasks) {
              minTaskMates.push(this.mates[i].getID());
          }
      }

      if (minTaskMates.length > 1) {
          return minTaskMates[Math.floor(Math.random() * minTaskMates.length)];
      } else {
          return minTaskMates[0];
      }
  }

  async reCreateTask(oldTask) { // pass in the old task
    this.task.duplicate(oldTask);
    this.task.setAssignedMateID(this.setNextMateAssignedToRecurringTask(this.task.getAssignedMateID()));
    this.task.setFavorMateID('');
    this.task.calcNewDate();
    this.task.setTaskID(await this.insertTaskIntoFirestore()); // assign the ID now that it has been upoaded to db
    return this.task;
  }

  setNextMateAssignedToRecurringTask(mateID) {
      for (var i = 0; i < this.mates.length - 1; ++i) {
          if (this.mates[i].getID() == mateID) {
              return this.mates[i + 1].getID();
          }
      }
      return this.mates[0].getID();
  }

}

try{
module.exports = RecurringTaskFactory;
}catch(e){

}
