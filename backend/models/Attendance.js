const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: [true, 'Attendance status is required'],
      default: 'Absent',
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    date: {
      type: String,
      required: [true, 'Date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
    },
    records: {
      type: [attendanceRecordSchema],
      validate: [
        (val) => val.length > 0,
        'Attendance sheet must contain at least one student record',
      ],
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
